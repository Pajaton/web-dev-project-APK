<template>
  <div>
    <b-container fluid>
      <h1 class="display-5 fw-bold">Get directions to a Systembolag</h1>
      <p class="fs-4">Click the button below to find the Systembolag closest to you</p>

      <b-row>
        <b-col>
          <MapDirections
            ref="mapDirections"
            location="Systembolag"
            @loading-change="isLoading = $event"
            @targets-loaded="targetLocations = $event"
          />

          <!-- Temp button for testing -->
          <b-button
            class="btn_message"
            variant="primary"
            @click="getDirections"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Locating...' : 'Get directions to a Systembolag' }}
          </b-button>
        </b-col>
        <b-col
          style="height: 600px; overflow-y: auto;"
          class="mt-3 border-start"
        >
          <LocationCard
            v-for="(target, index) in targetLocations"
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
import MapDirections from '@/components/MapDirections.vue'

export default {
  components: {
    MapDirections
  },
  data() {
    return {
      isLoading: false,
      targetLocations: [],
      userId: null
    }
  },
  methods: {
    getDirections() {
      this.$refs.mapDirections.getLocation()
    },
    handleCardSelection(locationData) {
      this.$refs.mapDirections.handleCardSelection(locationData)
    }
  }
}
</script>

<style>

</style>
