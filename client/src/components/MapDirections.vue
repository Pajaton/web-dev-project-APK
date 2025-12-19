<template>
  <div>
    <b-container fluid>
      <h1 class="display-5 fw-bold">Get directions to a {{ location }}</h1>
      <p class="fs-4">Click the button below to find the {{ location }} closest to you</p>

      <!-- Map canvas wrapper -->
      <b-row>
        <b-col>
          <div
            class="map-wrapper border mt-3"
            style="max-width: 800px; max-height: 600px; overflow: hidden;"
            :style="{ cursor: isDraggingMap ? 'grabbing' : 'grab' }"
            @mousedown="handleMouseDown"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
            @mousemove="handleMouseMove"
            @click="handleMouseClick"
            @wheel.prevent="handleScroll"
          >
            <canvas ref="mapCanvas"></canvas>

            <div
              v-if="isLoading"
              class="position-absolute top-50 start-50 translate-middle"
            >
              <b-spinner label="Loading..."></b-spinner>
            </div>
          </div>

          <!-- Temp button for testing -->
          <b-button
            class="btn_message"
            variant="primary"
            v-on:click="getLocation()"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Locating...' : 'Get directions to a ' + location }}
          </b-button>
        </b-col>
        <b-col
          style="height: 600px; overflow-y: auto;"
          class="mt-3 border-start"
        >
          <LocationCard
            v-for="(target, index) in mapData.targetLocations"
            :key="index"
            :location="target"
            :userId="userId"
            @select-location="handleCardSelection"
          />
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import { Api } from '@/Api'

class MinHeap {
  constructor(estimatedCost) {
    this.heap = []
    this.length = 0
    this.estimatedCost = estimatedCost // reference
  }

  // return and remove min value
  pop() {
    if (this.heap.length === 0) return null
    if (this.heap.length === 1) return this.heap.pop()

    const min = this.heap[0]
    this.heap[0] = this.heap.pop()
    this.length -= 1

    this.bubbleDown()

    return min
  }

  // insert a new node
  insert(nodeId) {
    this.heap.push(nodeId)
    this.bubbleUp()
    this.length += 1
  }

  // checks if a node is already in the heap
  includes(nodeId) {
    return this.heap.includes(nodeId)
  }

  // swaps a parent node with its child node
  swap(parentIndex, index) {
    [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]]
  }

  // moves node down in heap
  bubbleDown() {
    let index = 0
    let leftIndex = 1
    let rightIndex = 2

    while (leftIndex <= this.heap.length - 1) {
      leftIndex = index * 2 + 1
      rightIndex = index * 2 + 2
      let minIndex = index

      if (this.estimatedCost[this.heap[minIndex]] > this.estimatedCost[this.heap[leftIndex]]) {
        minIndex = leftIndex
      }
      if (this.estimatedCost[this.heap[minIndex]] > this.estimatedCost[this.heap[rightIndex]]) {
        minIndex = rightIndex
      }

      if (minIndex !== index) {
        this.swap(index, minIndex)
        index = minIndex
      } else {
        break
      }
    }
  }

  // moves node up in heap
  bubbleUp() {
    let index = this.heap.length - 1

    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2)

      if (this.estimatedCost[this.heap[parentIndex]] > this.estimatedCost[this.heap[index]]) {
        this.swap(parentIndex, index)
        index = parentIndex
      } else {
        break
      }
    }
  }
}

export default {
  props: {
    location: {
      type: String,
      default: 'location'
    }
  },
  data() {
    return {
      userId: null,
      message: '',
      coordinates: null,
      mapData: {},
      targetLocation: null,
      shortestPath: [],
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
      dragStart: { x: 0,y: 0 },
      mouseWheelTimer: null,

      // map configs
      bounds: { minLat: 0,maxLat: 0,minLon: 0,maxLon: 0 },
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

      let dataFetched = false

      while (!dataFetched) {
        try {
          const response = await Api.get('/maps/coordinates', {
            params: {
              userLat: this.coordinates.lat,
              userLng: this.coordinates.lng,
              type: this.location
            }
          })
          // Object.freeze to prevent Vue from making it reactive
          this.mapData = Object.freeze(response.data)

          dataFetched = true
        } catch (error) {
          console.log(`Error: ${error}`)

          if (error.status === 429) timeout(5000)
        }
      }

      // a user may not have the exact coords of a node, therefore
      // we must find the nearest node id based on user location
      this.userNodeId = this.getNearestNodeId(
        this.coordinates.lat,
        this.coordinates.lng
      )

      // same applies for a location, although in the case of systembolag
      // there are proper nodes from OSM, but they may or may not be connected
      // to any path or way
      this.targetNodes = this.mapData.targetLocations.map(target => {
        target.nodeId = this.getNearestNodeId(target.lat, target.lon)

        if (this.userNodeId && target.nodeId && this.mapData.nodes[this.userNodeId] && this.mapData.nodes[target.nodeId]) {
          const distance = this.getDistance(this.mapData.nodes[this.userNodeId], this.mapData.nodes[target.nodeId])

          if (!this.targetLocation || distance < this.targetLocation.distance) {
            this.targetLocation = {
              nodeId: target.nodeId,
              distance: distance
            }
          }
        }
        return target
      })

      const shortestPathFound = this.findShortestPath(this.userNodeId)

      if (shortestPathFound) {
        this.calculateBounds(this.mapData.nodes)
        this.prerenderMapBackground()

        // roughly center the map in the viewport (for rendering purposes)
        this.view.x = (this.canvasWidth - this.canvasFullWidth) / 2
        this.view.y = (this.canvasHeight - this.canvasFullHeight) / 2
        this.view.scale = 1.0

        this.focusMapOnUserLocation()

        this.$nextTick(() => {
          this.renderMap()
        })

      } else {
        this.message = "No path found."
      }

      this.isLoading = false
    },

    // find user latitude and longitude via either GPS (if a gps receiver
    // is installed on the device) or via network. Network is a lot less
    // precise.
    getUserCoordinates() {
      return new Promise((resolve, reject) => {
        this.message = 'Waiting for user permission...'
        this.coordinates = null

        if (!('geolocation' in navigator)) {
          this.message = 'Geolocation is not supported by this browser.'
          return
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
          {
            enableHighAccuracy: true,
            timeout: 20000
          }
        )
      })
    },

    // gets the id of the node to the passed coordinate (latitude, longitude)
    getNearestNodeId(lat, lng) {
      let nearestNodeId = null
      let minDistance = Infinity

      for (const nodeId in this.mapData.nodes) {
        const node = this.mapData.nodes[nodeId]
        const dLat = node.lat - lat
        const dLon = node.lon - lng
        const distance = (dLat * dLat) + (dLon * dLon)

        if (distance < minDistance) {
          minDistance = distance
          nearestNodeId = nodeId
        }

      }

      return nearestNodeId ? String(nearestNodeId) : null
    },

    // implemented shortest path algorithm with A*
    findShortestPath(startId) {
      const estimatedTotalCost = {}
      const nodesToVisit = new MinHeap(estimatedTotalCost)
      const targetId = this.targetLocation.nodeId
      const { nodes,adjacencyList } = this.mapData

      nodesToVisit.insert(startId)
      const cameFrom = {}
      const costToHere = {}

      Object.keys(nodes).forEach(nodeId => {
        costToHere[nodeId] = Infinity
        estimatedTotalCost[nodeId] = Infinity
      })

      costToHere[startId] = 0
      estimatedTotalCost[startId] = this.getDistance(nodes[startId], nodes[targetId])

      while (nodesToVisit.length > 0) {
        // dequeue
        const currentNode = nodesToVisit.pop()

        if (this.targetLocation.nodeId === currentNode) {
          this.shortestPath = this.reconstructPath(cameFrom,currentNode)

          return true
        }

        // get a node's connected edges
        const neighbors = adjacencyList[currentNode] || []

        for (const edge of neighbors) {
          const neighbor = String(edge.node)
          const costToNext = costToHere[currentNode] + edge.weight

          if (costToNext < costToHere[neighbor]) {
            cameFrom[neighbor] = currentNode
            costToHere[neighbor] = costToNext

            const estimatedNextCost = this.getDistance(nodes[neighbor], nodes[targetId])
            estimatedTotalCost[neighbor] = costToNext + estimatedNextCost

            if (!nodesToVisit.includes(neighbor)) {
              nodesToVisit.insert(neighbor)
            }
          }
        }
      }

      return false
    },

    // get the distance between node A and node B
    getDistance(nodeA, nodeB) {
      const R = 6371e3
      const toRadians = (degrees) => degrees * (Math.PI / 180)
      const latA = toRadians(nodeA.lat)
      const latB = toRadians(nodeB.lat)
      const dLat = toRadians(nodeB.lat - nodeA.lat)
      const dLon = toRadians(nodeB.lon - nodeA.lon)
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latA) * Math.cos(latB) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)

      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    },

    // build the shortest path
    reconstructPath(cameFrom, current) {
      const totalPath = [current]
      while (current in cameFrom) {
        current = cameFrom[current]
        totalPath.unshift(current) // dequeue
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

        // the +- 0.001 is bounds padding
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

      const x = percentageX * this.canvasFullWidth
      const y = this.canvasFullHeight - (percentageY * this.canvasFullHeight)
      return { x, y }
    },

    // renders all roads (not shortest path)
    prerenderMapBackground() {
      if (!this.offscreenCanvas) {
        this.offscreenCanvas = new OffscreenCanvas(this.canvasFullWidth, this.canvasFullHeight)
      }
      const ctxOffscreen = this.offscreenCanvas.getContext('2d')

      // init map backgroun by setting background to white
      ctxOffscreen.fillStyle = '#ffffff' // white
      ctxOffscreen.fillRect(0, 0, this.canvasFullWidth, this.canvasFullHeight)

      // init drawing
      ctxOffscreen.beginPath()
      ctxOffscreen.strokeStyle = 'darkgray'
      ctxOffscreen.lineWidth = 1 / this.view.scale

      const { adjacencyList, nodes } = this.mapData
      const processedEdges = new Set()

      for (const fromId in adjacencyList) {
        const fromNode = nodes[fromId]

        if (!fromNode) continue

        const neighbors = adjacencyList[fromId]
        neighbors.forEach(edge => {
          const toNode = nodes[edge.node]
          const edgeKey = [fromId,edge.node].sort().join('-') // Ensure edges are drawn once (A->B === B->A)

          if (toNode && !processedEdges.has(edgeKey)) {
            const p1 = this.project(fromNode.lat, fromNode.lon)
            const p2 = this.project(toNode.lat, toNode.lon)
            ctxOffscreen.moveTo(p1.x, p1.y) // move "brush" to x, y of p1
            ctxOffscreen.lineTo(p2.x, p2.y) // draw a line to x, y of p2, starting at x, y of p1

            processedEdges.add(edgeKey)
          }
        })
      }

      // draw the map
      ctxOffscreen.stroke()
    },

    renderMap() {
      if (!this.$refs.mapCanvas || !this.offscreenCanvas) return

      const canvas = this.$refs.mapCanvas
      this.ctx = canvas.getContext('2d')
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      this.ctx.save()

      // apply pan and zoom to the canvas and map
      this.ctx.translate(this.view.x, this.view.y)
      this.ctx.scale(this.view.scale, this.view.scale)

      this.ctx.drawImage(this.offscreenCanvas,0,0)

      if (this.shortestPath.length>0) {
        this.drawPath(this.mapData.nodes, this.shortestPath)

        const startNodeId = this.shortestPath[0]
        const targetNodeId = this.shortestPath[this.shortestPath.length - 1]
        this.drawMarker(this.mapData.nodes[startNodeId], '#005885') // Start

        this.targetNodes.forEach(targetNode => {
          this.drawMarker(this.mapData.nodes[targetNode.nodeId], '#76B07E')
        })
      }

      this.ctx.restore()
    },

    // on fetched map, center view on user
    focusMapOnUserLocation() {
      if (!this.coordinates) return

      const userCoords = this.project(this.coordinates.lat, this.coordinates.lng)

      const viewportCenterX = this.canvasWidth / 2
      const viewportCenterY = this.canvasHeight / 2

      this.view.x = viewportCenterX - (userCoords.x * this.view.scale)
      this.view.y = viewportCenterY - (userCoords.y * this.view.scale)
    },

    // draws the shortest path
    drawPath(nodes, pathIds) {
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#FF9494'
      this.ctx.lineWidth = 5 / this.view.scale // keep consistent visual width
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'

      if (pathIds.length < 2) return

      const start = nodes[pathIds[0]]
      const startProj = this.project(start.lat,start.lon)
      this.ctx.moveTo(startProj.x,startProj.y)

      pathIds.forEach(id => {
        const node = nodes[id]
        const locationOnMap = this.project(node.lat, node.lon)
        this.ctx.lineTo(locationOnMap.x, locationOnMap.y)
      })

      this.ctx.stroke()
    },

    drawMarker(node, color) {
      if (!node) return
      const proj = this.project(node.lat, node.lon)
      const radius = 8 / this.view.scale // keep consistent size

      this.ctx.beginPath()
      this.ctx.arc(proj.x,proj.y, radius, 0, 2 * Math.PI)
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

    handleMouseClick(event) {
      // prevent accidental clicks if moving mouse while clicking
      const distMoved = Math.hypot(
        event.clientX - this.dragStart.x,
        event.clientY - this.dragStart.y
      )
      if (distMoved > 5) return // user panning, not clicking

      const rect = this.$refs.mapCanvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // we have to check if the mouse's location aligns with
      // the location of a location marker
      this.targetNodes.forEach(targetNode => {
        const node = this.mapData.nodes[targetNode.nodeId]

        if (node) {
          const proj = this.project(node.lat, node.lon)

          const screenX = (proj.x * this.view.scale) + this.view.x
          const screenY = (proj.y * this.view.scale) + this.view.y

          const dx = mouseX - screenX
          const dy = mouseY - screenY
          const distance = Math.sqrt(dx ** 2 + dy ** 2)

          if (distance < 10 && this.targetLocation.nodeId !== targetNode.nodeId) {
            this.targetLocation.nodeId = targetNode.nodeId
            this.findShortestPath(this.userNodeId)
            this.$nextTick(() => this.renderMap())
          }
        }
      })
    },

    // another way of selecting target location
    handleCardSelection(locationData) {
      if (!this.userNodeId || !this.mapData.nodes) return

      const targetNodeId = this.getNearestNodeId(locationData.lat, locationData.lon)

      if (!targetNodeId) return

      this.targetLocation = {
        nodeId: targetNodeId,
        distance: 0
      }

      this.findShortestPath(this.userNodeId)

      this.$nextTick(() => {
        this.renderMap()
      })
    },

    // relates to zooming the map
    handleScroll(event) {
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
    },
    fetchCurrentUser() {
      Api.get('/sessions/currentlyLoggedin/')
        .then(response => {
          this.userId = response.data.user._id
          console.log(this.userId)
        })
        .catch(error => {
          this.message = error
        })
    }
  },
  mounted() {
    this.fetchCurrentUser()
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
