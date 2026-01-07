<template>
  <div>
    <div
      class="map-wrapper border position-relative"
      :style="{ cursor: isDraggingMap ? 'grabbing' : 'grab' }"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @mousemove="handleMapPan"
      @click="handleMouseClick"
      @wheel.prevent="handleScroll"
      @touchstart.prevent="handleTouchStart"
      @touchend="handleTouchEnd"
      @touchmove.prevent="handleTouchMove"
    >
      <div id="map-canvas"
        style="max-width: 800px; max-height: 600px; overflow: hidden;"
      >
        <canvas ref="mapCanvas"></canvas>
      </div>
      <div
        v-if="isLoading"
        class="spinner-overlay position-absolute top-50 start-50 translate-middle"
      >
        <b-spinner label="Loading..."></b-spinner>
      </div>
      <div class="position-absolute top-50 start-50 translate-middle">
        <p class="fw-bold" v-if="statusMessage !== ''">{{ statusMessage }}</p>
        <b-button v-if="!isLoading && !mapData.nodes"
          variant="primary"
          @click="getLocation"
          @touchstart.stop
          @touchend.stop="getLocation">{{ statusMessage !== '' ? 'Retry' : 'Find ' + location }}</b-button>
      </div>
    </div>

    <!-- notify user of path not found -->
    <BAlert
      :model-value="isPathNotFound"
      variant="warning"
      dismissible
      class="position-fixed top-0 start-50 translate-middle-x mt-5"
      style="z-index: 1000; min-width: 300px;"
    >
      Unable to find a path to this location. Try selecting a different one.
    </BAlert>
  </div>
</template>

<script>
import { Api } from '@/Api'

/**
 * @component MapDirections
 * @description Interactive map component that displays user location,
 * target locations (Systembolag/toilets), and calculates shortest paths using A* algorithm.
 * Supports pan, zoom, and touch interactions.
 * @emits {boolean} loading-change - Emitted when loading state changes.
 * @emits {Object} target-location - Emitted when a target location is selected.
 * @emits {Array} targets-loaded - Emitted when all target locations are loaded.
 * @emits mounted - Emitted when component is mounted.
 */

// constants
const EARTH_RADIUS_METERS = 6371e3
const CANVAS_CONFIG = {
  width: 800,
  height: 600,
  fullWidth: 3000,
  fullHeight: 2400
}
const ZOOM_LIMITS = { min: 0.1, max: 10 }
const CLICK_TOLERANCE_PX = 5 // max distance mouse can move and still register as a click

const MAX_ITERATIONS = 100000 // prevent infinite loops in pathfinding

/**
 * @class MinHeap
 * @description Priority queue implementation for A* pathfinding algorithm.
 */
class MinHeap {
  /**
   * @param {Object} estimatedCost - Reference to the estimated cost object for comparisons.
   */
  constructor(estimatedCost) {
    this.heap = []
    this.estimatedCost = estimatedCost // reference
  }

  get length() { return this.heap.length }

  /**
   * @description Removes and returns the minimum value from the heap.
   * @returns {string|null} The node ID with the lowest cost, or null if empty.
   */
  pop() {
    if (this.heap.length === 0) return null
    if (this.heap.length === 1) return this.heap.pop()

    const min = this.heap[0]
    this.heap[0] = this.heap.pop()
    this.bubbleDown()

    return min
  }

  /**
   * @description Inserts a new node into the heap.
   * @param {string} nodeId - The ID of the node to insert.
   */
  insert(nodeId) {
    this.heap.push(nodeId)
    this.bubbleUp()
  }

  /**
   * @description Checks if a node is already in the heap.
   * @param {string} nodeId - The ID of the node to check.
   * @returns {boolean} True if the node exists in the heap.
   */
  includes(nodeId) {
    return this.heap.includes(nodeId)
  }

  /**
   * @description Swaps two nodes in the heap by their indices.
   * @param {number} parentIndex - Index of the parent node.
   * @param {number} index - Index of the child node.
   */
  swap(parentIndex, index) {
    [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]]
  }

  /**
   * @description Restores heap property by moving a node down.
   */
  bubbleDown() {
    let index = 0
    let leftIndex = 1
    let rightIndex = 2

    while (leftIndex <= this.heap.length - 1) {
      leftIndex = index * 2 + 1
      rightIndex = index * 2 + 2
      let minIndex = index

      if (leftIndex < this.heap.length && this.estimatedCost[this.heap[minIndex]] > this.estimatedCost[this.heap[leftIndex]]) {
        minIndex = leftIndex
      }
      if (rightIndex < this.heap.length && this.estimatedCost[this.heap[minIndex]] > this.estimatedCost[this.heap[rightIndex]]) {
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

  /**
   * @description Restores heap property by moving a node up.
   */
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
    /** @type {string} The type of location to search for (e.g., 'systembolag', 'toilets'). */
    location: {
      type: String,
      default: 'location'
    }
  },
  emits: ['loading-change', 'target-location', 'targets-loaded', 'mounted'],
  data() {
    return {
      message: '',
      statusMessage: '',
      coordinates: null,
      mapData: {},
      targetLocation: null,
      shortestPath: [],
      isLoading: false,
      pathSearchFailed: false,

      // canvas
      ctx: null, // The visible screen
      offscreenCanvas: null, // The buffered background

      // viewport
      view: {
        x: 0,
        y: 0,
        scale: 1.0
      },

      // mouse events
      isDraggingMap: false,
      dragStart: { x: 0,y: 0 },
      mouseWheelTimer: null,

      // touch events
      touchStartPos: { x: 0,y: 0 },
      lastTouchDistance: null,

      // map configs
      bounds: { minLat: 0,maxLat: 0,minLon: 0,maxLon: 0 },
      canvasWidth: CANVAS_CONFIG.width, // visible width
      canvasHeight: CANVAS_CONFIG.height, // visible height

      canvasFullWidth: CANVAS_CONFIG.fullWidth, // rendered width
      canvasFullHeight: CANVAS_CONFIG.fullHeight // rendered height
    }
  },
  computed: {
    isPathNotFound: {
      get() {
        return this.pathSearchFailed && this.mapData.nodes && this.shortestPath.length === 0
      },
      set(newValue) {
        if (!newValue) this.pathSearchFailed = false
      }
    }
  },
  methods: {
    /**
     * @description Main method to fetch map data and calculate route.
     * Gets user coordinates, fetches nearby locations, and finds shortest path.
     */
    async getLocation() {
      this.isLoading = true
      this.statusMessage = ''
      this.$emit('loading-change', true)
      if (this.coordinates === null) {
        await this.getUserCoordinates()
      }

      let dataFetched = false

      try {
        const response = await Api.get('/maps/coordinates', {
          params: {
            userLat: this.coordinates.lat,
            userLon: this.coordinates.lng,
            type: this.location
          }
        })

        // Object.freeze to prevent Vue from making it reactive
        this.mapData = Object.freeze(response.data)
        dataFetched = true
      } catch (error) {
        if (!error.response) {
          this.statusMessage = "Network error. Please check your connection."
        } else if (error.response.data?.message) {
          this.statusMessage = error.response.data.message
        } else {
          this.message = `Error fetching map data: ${error.response.statusText}`
        }

        this.isLoading = false
        this.$emit('loading-change', false)
        return
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
          target.distance = this.getDistance(this.mapData.nodes[this.userNodeId], this.mapData.nodes[target.nodeId])
        } else {
          target.distance = Infinity
        }

        return target
      })

      // Sort by distance and pick the closest one
      this.targetNodes.sort((a, b) => a.distance - b.distance)
      this.targetLocation = this.targetNodes[0] || null

      if (!this.targetLocation) {
        this.statusMessage = "No locations found nearby."
        this.isLoading = false
        this.$emit('loading-change', false)
        return
      }

      this.$emit('target-location', this.targetLocation)

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
        this.pathSearchFailed = true
      }

      this.isLoading = false
      this.$emit('loading-change', false)
      this.$emit('targets-loaded', this.mapData.targetLocations || [])
    },

    /**
     * @description Gets user's current position via browser Geolocation API.
     * Uses GPS if available, falls back to network-based location.
     * @returns {Promise} Resolves when coordinates are obtained.
     */
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

    /**
     * @description Finds the nearest map node to given coordinates.
     * @param {number} lat - Latitude coordinate.
     * @param {number} lng - Longitude coordinate.
     * @returns {string|null} The ID of the nearest node.
     */
    getNearestNodeId(lat, lng) {
      let nearestNodeId = null
      let minDistance = Infinity

      for (const [nodeId, node] of Object.entries(this.mapData.nodes)) {
        const distance = (node.lat - lat) ** 2 + (node.lon - lng) ** 2

        if (distance < minDistance) {
          minDistance = distance
          nearestNodeId = nodeId
        }
      }

      return nearestNodeId
    },

    /**
     * @description Finds the shortest path using A* algorithm.
     * @param {string} startId - The starting node ID (user's location).
     * @returns {boolean} True if a path was found, false otherwise.
     */
    findShortestPath(startId) {
      this.shortestPath = []
      this.pathSearchFailed = false
      const targetId = this.targetLocation.nodeId
      const { nodes,adjacencyList } = this.mapData

      if (!nodes[startId] || !nodes[targetId]) {
        return false
      }

      const estimatedTotalCost = {}
      const nodesToVisit = new MinHeap(estimatedTotalCost)
      const cameFrom = {}
      const costToHere = {}
      const visited = new Set()
      
      Object.keys(nodes).forEach(nodeId => {
        costToHere[nodeId] = Infinity
        estimatedTotalCost[nodeId] = Infinity
      })
      
      costToHere[startId] = 0
      estimatedTotalCost[startId] = this.getDistance(nodes[startId], nodes[targetId])
      nodesToVisit.insert(startId)

      let iterations = 0

      while (nodesToVisit.length > 0) {
        if (++iterations > MAX_ITERATIONS) return false

        // dequeue
        const currentNode = nodesToVisit.pop()

        if (visited.has(currentNode)) continue
        visited.add(currentNode)

        if (this.targetLocation.nodeId === currentNode) {
          this.shortestPath = this.reconstructPath(cameFrom,currentNode)

          return true
        }

        // get a node's connected edges
        const neighbors = adjacencyList[currentNode] || []

        for (const edge of neighbors) {
          const neighbor = String(edge.node)

          if (visited.has(neighbor)) continue
          if (!nodes[neighbor]) continue  // skip if neighbor node doesn't exist

          const costToNext = costToHere[currentNode] + edge.weight

          if (costToNext < (costToHere[neighbor]) || Infinity) {
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

    /**
     * @description Calculates distance between two nodes using Haversine formula.
     * @param {Object} nodeA - First node with lat/lon properties.
     * @param {Object} nodeB - Second node with lat/lon properties.
     * @returns {number} Distance in meters.
     */
    getDistance(nodeA, nodeB) {
      const toRadians = (degrees) => degrees * (Math.PI / 180)
      const latA = toRadians(nodeA.lat)
      const latB = toRadians(nodeB.lat)
      const dLat = toRadians(nodeB.lat - nodeA.lat)
      const dLon = toRadians(nodeB.lon - nodeA.lon)
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latA) * Math.cos(latB) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)

      return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    },

    /**
     * @description Reconstructs the path from A* search results.
     * @param {Object} cameFrom - Map of node IDs to their predecessor.
     * @param {string} current - The destination node ID.
     * @returns {Array<string>} Ordered array of node IDs forming the path.
     */
    reconstructPath(cameFrom, current) {
      const totalPath = [current]
      while (current in cameFrom) {
        current = cameFrom[current]
        totalPath.unshift(current) // dequeue
      }
      return totalPath
    },

    /**
     * @description Calculates the geographic bounds of all nodes.
     * @param {Object} nodes - Object containing all map nodes.
     */
    calculateBounds(nodes) {
      const padding = 0.001 // ~100m padding
      let minLat = Infinity
      let maxLat = -Infinity
      let minLon = Infinity
      let maxLon = -Infinity

      for (const nodeId in nodes) {
        const node = nodes[nodeId]

        // the +- 0.001 is bounds padding
        if (node.lat < minLat) minLat = node.lat - padding
        if (node.lat > maxLat) maxLat = node.lat + padding
        if (node.lon < minLon) minLon = node.lon - padding
        if (node.lon > maxLon) maxLon = node.lon + padding
      }
      this.bounds = { minLat, maxLat, minLon, maxLon }
    },

    /**
     * @description Converts geographic coordinates to canvas pixel coordinates.
     * @param {number} lat - Latitude coordinate.
     * @param {number} lon - Longitude coordinate.
     * @returns {Object} Object with x and y pixel coordinates.
     */
    project(lat, lon) {
      const { minLat, maxLat, minLon, maxLon } = this.bounds
      if (maxLon === minLon || maxLat === minLat) return { x: 0, y: 0 }

      const percentageX = ((lon - minLon) / (maxLon - minLon))
      const percentageY = ((lat - minLat) / (maxLat - minLat))

      const x = percentageX * this.canvasFullWidth
      const y = this.canvasFullHeight - (percentageY * this.canvasFullHeight)
      return { x, y }
    },

    /**
     * @description Pre-renders all road segments to an offscreen canvas.
     * This improves performance by avoiding redrawing static elements.
     */
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

    /**
     * @description Renders the complete map including background, path, and markers.
     */
    renderMap() {
      if (!this.$refs.mapCanvas || !this.offscreenCanvas) return

      const canvas = this.$refs.mapCanvas
      this.ctx = canvas.getContext('2d')
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      this.ctx.save()

      this.ctx.translate(this.view.x, this.view.y)
      this.ctx.scale(this.view.scale, this.view.scale)

      this.ctx.drawImage(this.offscreenCanvas, 0, 0)

      // 1. Draw the path ONLY if it exists
      if (this.shortestPath.length > 0) {
        this.drawPath(this.mapData.nodes, this.shortestPath)
      }

      // 2. Draw the markers ALWAYS (if mapData exists)
      if (this.mapData.nodes) {
        // Draw the User/Start marker if we have a userNodeId
        if (this.userNodeId && this.mapData.nodes[this.userNodeId]) {
          this.drawMarker(this.mapData.nodes[this.userNodeId], '#005885')
        }
      
        // Draw all target markers
        this.targetNodes.forEach(targetNode => {
          // Highlight the currently selected target even if pathing failed
          const color = (this.targetLocation && targetNode.nodeId === this.targetLocation.nodeId) 
                        ? '#cc0000' // Darker red/green for the "selected" one
                        : '#76B07E'
          this.drawMarker(this.mapData.nodes[targetNode.nodeId], color)
        })
      }
    
      this.ctx.restore()
    },

    /**
     * @description Centers the map viewport on the user's current location.
     */
    focusMapOnUserLocation() {
      if (!this.coordinates) return

      const userCoords = this.project(this.coordinates.lat, this.coordinates.lng)

      const viewportCenterX = this.canvasWidth / 2
      const viewportCenterY = this.canvasHeight / 2

      this.view.x = viewportCenterX - (userCoords.x * this.view.scale)
      this.view.y = viewportCenterY - (userCoords.y * this.view.scale)
    },

    /**
     * @description Draws the calculated shortest path on the canvas.
     * @param {Object} nodes - Object containing all map nodes.
     * @param {Array<string>} pathIds - Ordered array of node IDs forming the path.
     */
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

    /**
     * @description Draws a circular marker on the canvas for a location.
     * @param {Object} node - Node object with lat/lon properties.
     * @param {string} color - Fill color for the marker.
     */
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

    /**
     * @description Handles mouse down event to start map dragging.
     * @param {MouseEvent} event - The mouse event.
     */
    handleMouseDown(event) {
      this.isDraggingMap = true
      this.dragStart.x = event.clientX
      this.dragStart.y = event.clientY
    },

    /**
     * @description Handles mouse up event to stop map dragging.
     */
    handleMouseUp() {
      this.isDraggingMap = false
    },

    /**
     * @description Handles mouse move event for panning the map.
     * @param {MouseEvent} event - The mouse event.
     */
    handleMapPan(event) {
      if (!this.isDraggingMap) return

      const dx = event.clientX - this.dragStart.x
      const dy = event.clientY - this.dragStart.y

      this.view.x += dx
      this.view.y += dy

      this.dragStart.x = event.clientX
      this.dragStart.y = event.clientY

      requestAnimationFrame(this.renderMap)
    },

    /**
     * @description Handles zooming the map centered on cursor position.
     * @param {MouseEvent|Object} event - Event with clientX/clientY coordinates.
     * @param {number} zoomFactor - Factor to multiply current scale by.
     */
    handleMapZoom(event, zoomFactor) {
      const newScale = Math.min(Math.max(this.view.scale * zoomFactor, ZOOM_LIMITS.min), ZOOM_LIMITS.max)

      const rect = this.$refs.mapCanvas.getBoundingClientRect()
      const eventX = event.clientX - rect.left
      const eventY = event.clientY - rect.top

      this.view.x = eventX - (eventX - this.view.x) * (newScale / this.view.scale)
      this.view.y = eventY - (eventY - this.view.y) * (newScale / this.view.scale)

      this.view.scale = newScale

      requestAnimationFrame(this.renderMap)
    },

    /**
     * @description Handles mouse wheel scroll for zooming.
     * @param {WheelEvent} event - The wheel event.
     */
    handleScroll(event) {
      const zoomSensitivity = 0.001
      const zoomFactor = Math.exp(-event.deltaY * zoomSensitivity)

      this.handleMapZoom(event, zoomFactor)
    },

    /**
     * @description Handles touch move for panning and pinch-to-zoom.
     * @param {TouchEvent} event - The touch event.
     */
    handleTouchMove(event) {
      if (event.touches.length === 1 && this.isDraggingMap) {
        // Single touch - dragging
        const touch = event.touches[0]
        this.handleMapPan(touch)

        requestAnimationFrame(this.renderMap)
      } else if (event.touches.length === 2) {
        // Two fingers - zooming
        const currentDistance = this.getTouchDistance(event.touches)

        if (this.lastTouchDistance) {
          const zoomFactor = currentDistance / this.lastTouchDistance
          const newScale = Math.min(Math.max(this.view.scale * zoomFactor, ZOOM_LIMITS.min), ZOOM_LIMITS.max)

          this.handleMapZoom({
            clientX: (event.touches[0].clientX + event.touches[1].clientX) / 2,
            clientY: (event.touches[0].clientY + event.touches[1].clientY) / 2
          }, zoomFactor)
        }

        this.lastTouchDistance = currentDistance
      }
    },

    /**
     * @description Handles click/tap on map to select a target location marker.
     * @param {MouseEvent|Touch} event - The click or touch event.
     */
    handleMapSelection(event) {
      const rect = this.$refs.mapCanvas.getBoundingClientRect()
      const eventX = event.clientX - rect.left
      const eventY = event.clientY - rect.top

      if (!this.mapData.nodes) return
      // we have to check if the "clicked" or "pressed" area on the map
      // is over a locaiton marker
      this.targetNodes.forEach(targetNode => {
        const node = this.mapData.nodes[targetNode.nodeId]

        if (node) {
          const proj = this.project(node.lat, node.lon)

          const screenX = (proj.x * this.view.scale) + this.view.x
          const screenY = (proj.y * this.view.scale) + this.view.y

          const dx = eventX - screenX
          const dy = eventY - screenY

          const distance = Math.sqrt(dx ** 2 + dy ** 2)

          if (distance < 10 && this.targetLocation.nodeId !== targetNode.nodeId) {
            
            this.targetLocation = targetNode
            const pathFound = this.findShortestPath(this.userNodeId)
            
            if (pathFound) {
              this.$emit('target-location', this.targetLocation)
            } else {
              this.pathSearchFailed = true
            }
            requestAnimationFrame(this.renderMap)
          }
        }
      })
    },

    /**
     * @description Handles mouse click, filtering out drag operations.
     * @param {MouseEvent} event - The mouse event.
     */
    handleMouseClick(event) {
      // prevent accidental clicks if moving mouse while clicking
      const distMoved = Math.hypot(
        event.clientX - this.dragStart.x,
        event.clientY - this.dragStart.y
      )
      if (distMoved > CLICK_TOLERANCE_PX) return // user panning, not clicking

      this.handleMapSelection(event)
    },

    /**
     * @description Handles location selection from external card component.
     * @param {Object} locationData - Location object with lat/lon properties.
     */
    handleCardSelection(locationData) {
      if (!this.userNodeId || !this.mapData.nodes) return

      const targetNodeId = this.getNearestNodeId(locationData.lat, locationData.lon)
      if (!targetNodeId) return

      this.targetLocation = { nodeId: targetNodeId, distance: 0 }
      const pathFound =this.findShortestPath(this.userNodeId)

      if (pathFound) {
        this.$emit('target-location', this.targetLocation)
      } else {
        this.pathSearchFailed = true
      }
      requestAnimationFrame(this.renderMap)
    },

    /**
     * @description Calculates distance between two touch points for pinch-to-zoom.
     * @param {TouchList} touches - List of active touch points.
     * @returns {number} Distance in pixels between the two touches.
     */
    getTouchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    },

    /**
     * @description Handles touch start for drag or pinch-to-zoom initialization.
     * @param {TouchEvent} event - The touch event.
     */
    handleTouchStart(event) {
      if (event.touches.length === 1) {
        // One finger touch
        this.isDraggingMap = true
        this.touchStartPos.x = event.touches[0].clientX
        this.touchStartPos.y = event.touches[0].clientY
        this.dragStart.x = event.touches[0].clientX
        this.dragStart.y = event.touches[0].clientY
      } else if (event.touches.length === 2) {
        // Two finger touch
        this.isDraggingMap = false
        this.lastTouchDistance = this.getTouchDistance(event.touches)
      }
    },

    /**
     * @description Handles touch end, detecting taps vs drags.
     * @param {TouchEvent} event - The touch event.
     */
    handleTouchEnd(event) {
      if (event.changedTouches.length === 1) {
        const touch = event.changedTouches[0]
        const distMoved = Math.hypot(
          touch.clientX - this.touchStartPos.x,
          touch.clientY - this.touchStartPos.y
        )

        if (distMoved < CLICK_TOLERANCE_PX) {
          this.handleMapSelection(touch)
        }
      }

      this.isDraggingMap = false
      this.lastTouchDistance = null
    },

    /**
     * @description Resizes the canvas to configured dimensions and re-renders.
     */
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
    this.$emit('mounted')
  }
}
</script>

<style>
.btn_message {
  margin-bottom: 1em;
}
</style>
