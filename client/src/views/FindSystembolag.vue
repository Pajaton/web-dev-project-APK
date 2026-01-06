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
  mounted() {
    this.fetchCurrentUser()
  },
  methods: {
    fetchCurrentUser() {
      Api.get('/sessions/currentlyLoggedin/')
        .then(response => {
          this.userId = response.data.user._id
        })
        .catch(() => {
          this.userId = null
        })
    },
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
