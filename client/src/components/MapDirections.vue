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
          style="width: 100%; background-color: #f8f9fa;"
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
        The {{ location }} closest to you is: <pre class="mt3 bg-light p-3 border">{{ fetchedSystembolag }}</pre>
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
      fetchedSystembolag: [],
      coordinates: null,
      isLoading: false,
      ctx: null,
      bounds: { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 },
      canvasWidth: 800,
      canvasHeight: 600
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

        const mapData = response.data
        const userNodeId = this.getNearestNodeId(
          mapData,
          this.coordinates.lat,
          this.coordinates.lng
        )
        const targetNodeIds = mapData.targetLocations.map(target => {
          return this.getNearestNodeId(mapData, target.lat, target.lon)
        })
        this.fetchedSystembolag = this.findShortestPath(userNodeId, targetNodeIds, mapData)

        this.$nextTick(() => {
          this.renderMap(mapData, this.fetchedSystembolag)
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

    getNearestNodeId(mapData, lat, lng) {
      const { nodes } = mapData
      let nearestNodeId = null
      let minDistance = Infinity

      for (const nodeId in nodes) {
        if (!mapData.adjacencyList[nodeId] || mapData.adjacencyList[nodeId].length === 0) {
          continue // skip isolated nodes
        }
        const node = nodes[nodeId]
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
    findShortestPath(startId, targets, mapData) {
      const { nodes, adjacencyList } = mapData
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

      for (const nodeId in nodes) {
        const node = nodes[nodeId]
        if (node.lat < minLat) minLat = node.lat
        if (node.lat > maxLat) maxLat = node.lat
        if (node.lon < minLon) minLon = node.lon
        if (node.lon > maxLon) maxLon = node.lon
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

    renderMap(mapData, pathResult) {
      const canvas = this.$refs.mapCanvas
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      this.ctx = canvas.getContext('2d')
      this.canvasWidth = rect.width
      this.canvasHeight = rect.height
      this.ctx.scale(dpr, dpr)

      this.ctx.globalAlpha = 1.0
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'

      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

      this.calculateBounds(mapData.nodes)

      this.drawRoads(mapData)

      if (pathResult && pathResult.found) {
        this.drawPath(mapData.nodes, pathResult.path)

        const startNodeId = pathResult.path[0]
        const targetNodeId = pathResult.path[pathResult.path.length - 1]
        this.drawMarker(mapData.nodes[startNodeId], 'blue') // Start
        this.drawMarker(mapData.nodes[targetNodeId], 'blue') // Target
      }
    },

    drawRoads(mapData) {
      const { adjacencyList, nodes } = mapData

      this.ctx.beginPath()
      this.ctx.strokeStyle = 'lightblue'
      this.ctx.lineWidth = 1

      let counter = 0
      const batchSize = 500

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
            counter++
          }
        })

        if (counter >= batchSize) {
          this.ctx.stroke()
          this.ctx.beginPath()
          counter = 0
        }
      }
      this.ctx.stroke()
    },
    drawPath(nodes, pathIds) {
      this.ctx.beginPath()
      this.ctx.strokeStyle = 'blue'
      this.ctx.lineWidth = 4
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

      this.ctx.beginPath()
      this.ctx.arc(proj.x, proj.y, 6, 0, 2 * Math.PI)
      this.ctx.fillStyle = color
      this.ctx.fill()
      this.ctx.strokeStyle = 'white'
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }
  },
  created() {
    this.getUserCoordinates() // Pre-fetch coordinates on component creation (page load)
  }
}
</script>

<style>
.btn_message {
  margin-bottom: 1em;
}
</style>
