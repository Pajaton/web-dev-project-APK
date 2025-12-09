<template>
  <div>
    <b-container fluid>
      <h1 class="display-5 fw-bold">Get directions to a {{ location }}</h1>
      <p class="fs-4">Click the button below to find the {{ location }} closest to you</p>

      <!-- Map canvas -->
      <div class="map-wrapper border mt-3" style="position: relative;">
        <canvas
          ref="mapCanvas"
          width="800"
          height="600"
          @mousedown="handleMouseDown"
          @mouseUp="handleMouseUp"
          @mousemove="handleMouseMove"
        ></canvas>
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
      ctx: null,
      offscreenCanvas: null,
      renderPending: false,
      bounds: { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 },
      canvasWidth: 800,
      canvasHeight: 600,

      // map movement
      isDraggingMap: false,
      prevMouseX: 0,
      prevMouseY: 0,
      newX: 0,
      newY: 0
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

        this.$nextTick(() => {
          this.renderMap(this.mapData, this.pathResult)
        })

        this.isLoading = false
      }
    },

    getUserCoordinates() {
      return new Promise((resolve, reject) => {
        // initialize state
        this.message = 'Waiting for user permission...'
        this.coordinates = null

        // check if geolocation is supported
        if (!('geolocation' in navigator)) {
          this.message = 'Geolocation is not supported by this browser.'
          return
        }

        const options = {
          enableHighAccuracy: true, // Use WiFi scanning/GPS (more precise)
          timeout: 20000 // Wait 20 seconds before failing
        }

        // Request geolocation from browser
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

    getNearestNodeId(lat, lng) {
      let nearestNodeId = null
      let minDistance = Infinity

      for (const nodeId in this.mapData.nodes) {
        if (!this.mapData.adjacencyList[nodeId] || this.mapData.adjacencyList[nodeId].length === 0) {
          continue // skip isolated nodes
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

    // Shortest path algorithm implemented as A*
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
        nodesToVisit.sort((a, b) => estimatedTotalCost[a] - estimatedTotalCost[b]) // Sort by estimated total cost (priority queue)
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

    getHeuristic(nodeId, targets, nodes) {
      let minDistance = Infinity
      const currentNode = nodes[nodeId]

      for (const targetId of targets) {
        const targetNode = nodes[targetId]

        if (!targetNode) continue

        const distance = this.getDistance(currentNode, targetNode)

        if (distance < minDistance) {
          minDistance = distance
        }
      }

      return minDistance
    },

    getDistance(nodeA, nodeB) {
      const R = 6371e3 // radius of earth in meters
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

    reconstructPath(cameFrom, current) {
      const totalPath = [current]

      while (current in cameFrom) {
        current = cameFrom[current]
        totalPath.unshift(current)
      }

      return totalPath
    },

    calculateBounds(nodes) {
      let minLat = Infinity
      let maxLat = -Infinity
      let minLon = Infinity
      let maxLon = -Infinity

      for (const nodeId in nodes[1]) {
        const node = nodes[1][nodeId]
        if (nodes[0].includes(nodeId)) {
          if (node.lat < minLat) minLat = node.lat - 0.001
          if (node.lat > maxLat) maxLat = node.lat + 0.001
          if (node.lon < minLon) minLon = node.lon - 0.001
          if (node.lon > maxLon) maxLon = node.lon + 0.001
        }
      }

      this.bounds = { minLat, maxLat, minLon, maxLon }
    },

    // converts lat/lon to x/y on canvas
    project(lat, lon) {
      const { minLat, maxLat, minLon, maxLon } = this.bounds
      const percentageX = ((lon - minLon) / (maxLon - minLon))
      const percentageY = ((lat - minLat) / (maxLat - minLat))

      const x = percentageX * this.canvasWidth
      const y = this.canvasHeight - (percentageY * this.canvasHeight) // Invert

      return { x, y }
    },

    prerenderMap() {
      this.offscreenCanvas = document.createElement('canvas')
      this.offscreenCanvas.width = this.canvasWidth
      this.offscreenCanvas.height = this.canvasHeight
      const offscreenCanvasCtx = this.offscreenCanvas.getContext('2d')

      this.offscreenCanvas.lineCap = 'round'
      this.offscreenCanvas.lineJoin = 'round'

      this.drawRoads(this.offscreenCanvas, offscreenCanvasCtx)
    },

    renderMap() {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

      this.ctx.save() // save current state
      this.ctx.translate(this.newX, this.newY) // move the viewport/camera

      if (this.offscreenCanvas) {
        this.ctx.drawImage(this.offscreenCanvas, 0, 0)
      } else {
        this.drawRoads(this.mapData, this.ctx)
      }

      if (this.bounds.minLat === 0 && this.bounds.maxLat === 0) {
        this.calculateBounds([this.pathResult.path, this.mapData.nodes])
      }

      if (this.pathResult && this.pathResult.found) {
        this.drawPath(this.mapData.nodes, this.pathResult.path, this.ctx)

        const startNodeId = this.pathResult.path[0]
        const targetNodeId = this.pathResult.path[this.pathResult.path.length - 1]
        this.drawMarker(this.mapData.nodes[startNodeId], '#005885', this.ctx) // Start
        this.drawMarker(this.mapData.nodes[targetNodeId], '#76B07E', this.ctx) // Target
      }

      this.ctx.restore() // restore state
    },

    drawRoads(mapData, ctx) {
      const { adjacencyList, nodes } = mapData

      ctx.beginPath()
      ctx.strokeStyle = 'darkgray'
      ctx.lineWidth = 1

      for (const fromId in adjacencyList) {
        const fromNode = nodes[fromId]
        if (!fromNode) continue

        const neighbors = adjacencyList[fromId]

        neighbors.forEach(edge => {
          const toNode = nodes[edge.node]
          if (toNode) {
            const p1 = this.project(fromNode.lat, fromNode.lon)
            const p2 = this.project(toNode.lat, toNode.lon)

            // draw line
            this.ctx.moveTo(p1.x, p1.y)
            this.ctx.lineTo(p2.x, p2.y)
          }
        })
      }
      this.ctx.stroke()
    },
    drawPath(nodes, pathIds, ctx) {
      ctx.beginPath()
      ctx.strokeStyle = '#FF9494'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (pathIds.length < 2) return

      const start = nodes[pathIds[0]]
      const startProj = this.project(start.lat, start.lon)
      ctx.moveTo(startProj.x, startProj.y)

      for (let i = 1; i < pathIds.length; i++) {
        const node = nodes[pathIds[i]]
        const proj = this.project(node.lat, node.lon)
        ctx.lineTo(proj.x, proj.y)
      }
      ctx.stroke()
    },

    drawMarker(node, color, ctx) {
      if (!node) return

      const proj = this.project(node.lat, node.lon)

      ctx.beginPath()
      ctx.arc(proj.x, proj.y, 6, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    },

    handleMouseDown(event) {
      this.isDraggingMap = true

      // store initial dragging position
      this.prevMouseX = event.clientX
      this.prevMouseY = event.clientY
    },

    handleMouseUp() {
      this.isDraggingMap = false
    },

    handleMouseMove(event) {
      if (!this.isDraggingMap) return

      // calculate the new position of the map
      this.newX += event.clientX - this.prevMouseX
      this.newY += event.clientY - this.prevMouseY

      // store current mouse position
      this.prevMouseX = event.clientX
      this.prevMouseY = event.clientY

      // re-render map with new offset
      if (!this.renderPending) {
        this.renderPending = true
        requestAnimationFrame(() => {
          this.renderMap()
          this.renderPending = false
        })
      }
    },

    resizeCanvas() {
      const canvas = this.$refs.mapCanvas
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      this.canvasWidth = rect.width
      this.canvasHeight = rect.height

      this.ctx = canvas.getContext('2d')
    }
  },
  mounted() {
    this.resizeCanvas()
    this.getUserCoordinates() // Pre-fetch coordinates on component creation (page load)
  }
}
</script>

<style>
.btn_message {
  margin-bottom: 1em;
}
</style>
