<template>
  <div>
    <b-container fluid>
      <h1 class="display-5 fw-bold">Get directions to a Systembolag</h1>

      <b-row>
        <b-col cols="12" lg="8">
          <MapDirections
            ref="mapDirections"
            location="Systembolag"
            @loading-change="isLoading = $event"
            @targets-loaded="targetLocations = $event"
          />

          
        </b-col>
        <b-col cols="6" lg="4" sm="12"
          style="height: 600px; overflow-y: auto;"
          class="mt-3 border-start"
        >
          <b-row>
            <b-col cols="12" sm="6" lg="12"
              v-for="(target, index) in targetLocations"
              :key="index">
              <LocationCard
                :location="target"
                :userId="userId"
                :currentFavoriteId="favoriteSystembolagId"
                @favorite-updated="handleFavoriteChange"
                @select-location="handleCardSelection"
              />
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import {Api} from '@/Api.js'
import MapDirections from '@/components/MapDirections.vue'

/**
 * @view FindSystembolag
 * @description Page for finding nearby Systembolaget stores with map directions.
 * Displays an interactive map and list of nearby stores.
 */
export default {
  components: {
    MapDirections
  },
  data() {
    return {
      isLoading: false,
      targetLocations: [],
      userId: null,
      favoriteSystembolagId: null 
    }
  },
  async mounted() {
    await this.fetchCurrentUser()

    if (this.userId) {
      await this.fetchFavSystembolag()
    }
  },
  methods: {
    /**
     * @description Fetches the currently logged-in user's ID.
     */
    async fetchCurrentUser() {
      try {
        const response = await Api.get('/sessions/currentlyLoggedin/')
        this.userId = response.data.user._id
      } catch {
        this.userId = null
      }
    },

    /**
     * @description Triggers the map to fetch user location and directions.
     */
    getDirections() {
      this.$refs.mapDirections.getLocation()
    },

    /**
     * @description Handles location card selection and updates map.
     * @param {Object} locationData - The selected location object.
     */
    handleCardSelection(locationData) {
      this.$refs.mapDirections.handleCardSelection(locationData)
    },

    /**
     * @description Fetches the user's favorite Systembolaget store.
     */
    async fetchFavSystembolag() {
      if (!this.userId) return
      try {
        const response = await Api.get(`/users/${this.userId}/favorites/systembolag`)
        this.favoriteSystembolagId = response.data.favoriteSystembolag?.systembolagID ?? null
      } catch (error) {
        console.error('Error fetching favorite Systembolag:', error)
      }
    },

    /**
     * @description Updates the favorite Systembolaget ID when changed.
     * @param {number|null} newFavId - The new favorite store ID.
     */
    handleFavoriteChange(newFavId) {
      this.favoriteSystembolagId = newFavId
    }
  }
}
</script>

<style>

</style>
