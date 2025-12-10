<template>
  <div>
    <b-container fluid>
      <h1 class="display-5 fw-bold">Get directions to a {{ location }}</h1>
      <p class="fs-4">Click the button below to find the {{ location }} closest to you</p>

      <!-- Map canvas wrapper -->
      <div
        class="map-wrapper border mt-3"
        style="width: 800px; height: 600px; overflow: hidden;"
        :style="{ cursor: isDraggingMap ? 'grabbing' : 'grab' }"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @mousemove="handleMouseMove"
        @wheel.prevent="handleWheel"
      >
        <canvas ref="mapCanvas"></canvas>

        <div v-if="isLoading" class="position-absolute top-50 start-50 translate-middle">
           <b-spinner label="Loading..."></b-spinner>
        </div>
      </div>

      <!-- Temp button for testing -->
      <b-button
        class="btn_message"
        variant="primary"
        v-on:click="getLocation()"
        :disabled="isLoading">
        {{ isLoading ? 'Locating...' : 'Get directions to a ' + location }}
      </b-button>

      <p class="col-xl-9">
        The {{ location }} closest to you is: <pre class="mt3 bg-light p-3 border">{{ pathResult }}</pre>
      </p>
    </b-container>
  </div>
</template>

<script>
import { Api } from '@/Api'

export default {
  props: {
    location: {
      type: String,
      default: 'location'
    }
  },
  data() {
    return {
      message: '',
      coordinates: null,
      mapData: {},
      pathResult: {},
      isLoading: false,

      // canvas
      ctx: null, // The visible screen
      offscreenCanvas: null, // The buffered background

      // viewport
      view: {
        x: 0,
        y: 0,
        scale: 1.0
      },

      isDraggingMap: false,
      dragStart: { x: 0, y: 0 },
      mouseWheelTimer: null,

      // map configs
      bounds: { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 },
      canvasWidth: 800, // visible width
      canvasHeight: 600, // visible height

      canvasFullWidth: 3000, // rendered width
      canvasFullHeight: 2400 // rendered height
    }
  },
  methods: {
    async getLocation() {
      this.isLoading = true
      if (this.coordinates === null) {
        await this.getUserCoordinates()
      }

      if (this.location.toLowerCase() === 'systembolag') {
        const response = await Api.get('/maps/coordinates', {
          params: {
            userLat: this.coordinates.lat,
            userLng: this.coordinates.lng,
            type: this.location
          }
        })

        this.mapData = response.data
        const userNodeId = this.getNearestNodeId(
          this.coordinates.lat,
          this.coordinates.lng
        )
        const targetNodeIds = this.mapData.targetLocations.map(target => {
          return this.getNearestNodeId(target.lat, target.lon)
        })
        this.pathResult = this.findShortestPath(userNodeId, targetNodeIds)

        this.calculateBounds(this.mapData.nodes)
        this.prerenderMapBackground()

        // roughly center the map in the viewport
        this.view.x = (this.canvasWidth - this.worldBaseWidth) / 2
        this.view.y = (this.canvasHeight - this.worldBaseHeight) / 2
        this.view.scale = 1.0

        this.$nextTick(() => {
          this.renderMap()
        })

        this.isLoading = false
      }
    },

    getUserCoordinates() {
      return new Promise((resolve, reject) => {
        this.message = 'Waiting for user permission...'
        this.coordinates = null

        if (!('geolocation' in navigator)) {
          this.message = 'Geolocation is not supported by this browser.'
          return
        }

        const options = {
          enableHighAccuracy: true,
          timeout: 20000
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.message = 'Location successfully retrieved!'
            this.coordinates = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            resolve()
          },
          (error) => {
            this.message = `Error: ${error.message}`
            reject(error)
          },
          options
        )
      })
    },

    // gets the nearest node id to a coordinate (latitude, longitude)
    getNearestNodeId(lat, lng) {
      let nearestNodeId = null
      let minDistance = Infinity

      for (const nodeId in this.mapData.nodes) {
        if (!this.mapData.adjacencyList[nodeId] || this.mapData.adjacencyList[nodeId].length === 0) {
          continue
        }
        const node = this.mapData.nodes[nodeId]
        const deltaLat = node.lat - lat
        const deltaLng = node.lon - lng
        const distance = (deltaLat * deltaLat) + (deltaLng * deltaLng)

        if (distance < minDistance) {
          minDistance = distance
          nearestNodeId = nodeId
        }
      }

      return nearestNodeId ? String(nearestNodeId) : null
    },

    // implemented shortest path algorithm with A*
    findShortestPath(startId, targets) {
      const { nodes, adjacencyList } = this.mapData
      const targetSet = new Set(targets)

      const nodesToVisit = [startId]
      const cameFrom = {}
      const costToHere = {}
      const estimatedTotalCost = {}

      Object.keys(nodes).forEach(nodeId => {
        costToHere[nodeId] = Infinity
        estimatedTotalCost[nodeId] = Infinity
      })

      costToHere[startId] = 0
      estimatedTotalCost[startId] = this.getHeuristic(startId, targets, nodes)

      while (nodesToVisit.length > 0) {
        nodesToVisit.sort((a, b) => estimatedTotalCost[a] - estimatedTotalCost[b])
        const currentNode = nodesToVisit.shift()

        if (targetSet.has(currentNode)) {
          return {
            found: true,
            targetId: currentNode,
            path: this.reconstructPath(cameFrom, currentNode),
            distance: costToHere[currentNode]
          }
        }

        const neighbors = adjacencyList[currentNode] || []

        for (const edge of neighbors) {
          const neighbor = String(edge.node)
          const costToNext = costToHere[currentNode] + edge.weight

          if (costToNext < costToHere[neighbor]) {
            cameFrom[neighbor] = currentNode
            costToHere[neighbor] = costToNext

            const estimatedNextCost = this.getHeuristic(neighbor, targets, nodes)
            estimatedTotalCost[neighbor] = costToNext + estimatedNextCost

            if (!nodesToVisit.includes(neighbor)) {
              nodesToVisit.push(neighbor)
            }
          }
        }
      }

      return { found: false, distance: Infinity, path: [] }
    },

    // get the shortest distance between nodes
    getHeuristic(nodeId, targets, nodes) {
      let minDistance = Infinity
      const currentNode = nodes[nodeId]
      for (const targetId of targets) {
        const targetNode = nodes[targetId]
        if (!targetNode) continue
        const distance = this.getDistance(currentNode, targetNode)
        if (distance < minDistance) minDistance = distance
      }
      return minDistance
    },

    // get the distance between node A and node B
    getDistance(nodeA, nodeB) {
      const R = 6371e3
      const toRadians = (degrees) => degrees * (Math.PI / 180)
      const latA = toRadians(nodeA.lat)
      const latB = toRadians(nodeB.lat)
      const deltaLat = toRadians(nodeB.lat - nodeA.lat)
      const deltaLon = toRadians(nodeB.lon - nodeA.lon)
      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(latA) * Math.cos(latB) *
                  Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    },

    // build the shortest path
    reconstructPath(cameFrom, current) {
      const totalPath = [current]
      while (current in cameFrom) {
        current = cameFrom[current]
        totalPath.unshift(current)
      }
      return totalPath
    },

    // gets the node bounds
    calculateBounds(nodes) {
      let minLat = Infinity
      let maxLat = -Infinity
      let minLon = Infinity
      let maxLon = -Infinity

      for (const nodeId in nodes) {
        const node = nodes[nodeId]
        if (node.lat < minLat) minLat = node.lat - 0.001
        if (node.lat > maxLat) maxLat = node.lat + 0.001
        if (node.lon < minLon) minLon = node.lon - 0.001
        if (node.lon > maxLon) maxLon = node.lon + 0.001
      }
      this.bounds = { minLat, maxLat, minLon, maxLon }
    },

    // translates latitude and longitude coordinates into x and y values
    project(lat, lon) {
      const { minLat, maxLat, minLon, maxLon } = this.bounds
      if (maxLon === minLon || maxLat === minLat) return { x: 0, y: 0 }

      const percentageX = ((lon - minLon) / (maxLon - minLon))
      const percentageY = ((lat - minLat) / (maxLat - minLat))

      const x = percentageX * this.worldBaseWidth
      const y = this.worldBaseHeight - (percentageY * this.worldBaseHeight)
      return { x, y }
    },

    // renders all roads (not shortest path)
    prerenderMapBackground() {
      if (!this.offscreenCanvas) {
        this.offscreenCanvas = new OffscreenCanvas(this.worldBaseWidth, this.worldBaseHeight)
      }
      const ctxOffscreen = this.offscreenCanvas.getContext('2d')

      ctxOffscreen.fillStyle = '#ffffff' // white
      ctxOffscreen.fillRect(0, 0, this.worldBaseWidth, this.worldBaseHeight)

      ctxOffscreen.beginPath()
      ctxOffscreen.strokeStyle = 'darkgray'
      ctxOffscreen.lineWidth = 1 / this.view.scale

      const { adjacencyList, nodes } = this.mapData

      for (const fromId in adjacencyList) {
        const fromNode = nodes[fromId]

        if (!fromNode) continue

        const neighbors = adjacencyList[fromId]
        neighbors.forEach(edge => {
          const toNode = nodes[edge.node]

          if (toNode) {
            const p1 = this.project(fromNode.lat, fromNode.lon)
            const p2 = this.project(toNode.lat, toNode.lon)
            ctxOffscreen.moveTo(p1.x, p1.y) // move "brush" to x, y of p1
            ctxOffscreen.lineTo(p2.x, p2.y) // draw a line to x, y of p2, starting at x, y of p1
          }
        })
      }

      ctxOffscreen.stroke()
      this.canvasBitmap = this.offscreenCanvas.transferToImageBitmap()
    },

    renderMap() {
      if (!this.$refs.mapCanvas || !this.offscreenCanvas) return

      const canvas = this.$refs.mapCanvas
      this.ctx = canvas.getContext('2d')

      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

      this.ctx.save()

      this.ctx.translate(this.view.x, this.view.y)
      this.ctx.scale(this.view.scale, this.view.scale)

      this.ctx.drawImage(this.canvasBitmap, 0, 0)

      if (this.pathResult && this.pathResult.found) {
        this.drawPath(this.mapData.nodes, this.pathResult.path)

        const startNodeId = this.pathResult.path[0]
        const targetNodeId = this.pathResult.path[this.pathResult.path.length - 1]
        this.drawMarker(this.mapData.nodes[startNodeId], '#005885') // Start
        this.drawMarker(this.mapData.nodes[targetNodeId], '#76B07E') // Target
      }

      this.ctx.restore()
    },

    drawPath(nodes, pathIds) {
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#FF9494'
      this.ctx.lineWidth = 5 / this.view.scale // keep consistent visual width
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'

      if (pathIds.length < 2) return

      const start = nodes[pathIds[0]]
      const startProj = this.project(start.lat, start.lon)
      this.ctx.moveTo(startProj.x, startProj.y)

      for (let i = 1; i < pathIds.length; i++) {
        const node = nodes[pathIds[i]]
        const proj = this.project(node.lat, node.lon)
        this.ctx.lineTo(proj.x, proj.y)
      }
      this.ctx.stroke()
    },

    drawMarker(node, color) {
      if (!node) return
      const proj = this.project(node.lat, node.lon)
      const radius = 8 / this.view.scale // keep consistent size

      this.ctx.beginPath()
      this.ctx.arc(proj.x, proj.y, radius, 0, 2 * Math.PI)
      this.ctx.fillStyle = color
      this.ctx.fill()
      this.ctx.strokeStyle = 'white'
      this.ctx.lineWidth = 2 / this.view.scale
      this.ctx.stroke()
    },

    handleMouseDown(event) {
      this.isDraggingMap = true
      this.dragStart.x = event.clientX
      this.dragStart.y = event.clientY
    },

    handleMouseUp() {
      this.isDraggingMap = false
    },

    handleMouseMove(event) {
      if (!this.isDraggingMap) return

      const dx = event.clientX - this.dragStart.x
      const dy = event.clientY - this.dragStart.y

      this.view.x += dx
      this.view.y += dy

      this.dragStart.x = event.clientX
      this.dragStart.y = event.clientY

      requestAnimationFrame(this.renderMap)
    },

    handleWheel(event) {
      const zoomSensitivity = 0.001
      const zoomFactor = Math.exp(-event.deltaY * zoomSensitivity)
      const newScale = Math.min(Math.max(this.view.scale * zoomFactor, 0.1), 10)

      const rect = this.$refs.mapCanvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      this.view.x = mouseX - (mouseX - this.view.x) * (newScale / this.view.scale)
      this.view.y = mouseY - (mouseY - this.view.y) * (newScale / this.view.scale)
      this.view.scale = newScale

      requestAnimationFrame(this.renderMap)
    },

    resizeCanvas() {
      const canvas = this.$refs.mapCanvas
      if (!canvas) return
      canvas.width = this.canvasWidth
      canvas.height = this.canvasHeight

      if (this.offscreenCanvas) {
        this.renderMap()
      }
    }
  },
  mounted() {
    this.resizeCanvas()
    this.getUserCoordinates()
  }
}
</script>

<style>
.btn_message {
  margin-bottom: 1em;
}
</style>
