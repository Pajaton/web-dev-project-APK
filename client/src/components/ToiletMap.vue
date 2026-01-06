<template>
    <div>
        <BButton
            id="toilet-button"
            variant="primary"
            @click="openPanel"
        >
            🚽
        </BButton>
        <BOffcanvas
            id="toilet-offcanvas"
            v-model="showPanel"
            placement="end"
            :backdrop="false"
            body-scrolling
            title="Find toilets"
        >
            <div id="toilet-info" flush v-if="targetToilet !== null">
              <b-list-group>
                <b-list-group-item>
                  <p>Toilet at {{ targetToilet.street }}</p>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.directions">
                  <p>Directions: {{ targetToilet.directions }}</p>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.comment">
                  <p>Comment: {{ targetToilet.comment }}</p>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.unisex">
                  <p>{{ targetToilet.unisex ? 'The toilet is unisex' : 'The toilet is not unisex' }}</p>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.accessible">
                  <p>{{ targetToilet.accessible ? 'The toilet is accessible' : 'The toilet is not accessible' }}</p>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.changingTable">
                  <p>{{ targetToilet.changingTable ? 'The toilet has a changing table' : 'The toilet does not have a changing table' }}</p>
                </b-list-group-item>
                <b-list-group-item>
                  <p>Upvotes: {{ targetToilet.upvotes }}<br>Downvotes: {{ targetToilet.downvotes }}</p>
                </b-list-group-item>
              </b-list-group>
            </div>
            <MapDirections
              v-if="hasOpened"
              ref="mapDirections"
              location="toilets"
              @loading-change="isLoading = $event"
              @target-location="targetToilet = $event"
            />
        </BOffcanvas>
    </div>
</template>

<script>
import MapDirections from './MapDirections.vue'

export default {
  components: { MapDirections },
  data() {
    return {
      targetToilet: null,
      showPanel: false,
      hasOpened: false,
      isLoading: false,
      mapLoaded: false
    }
  },
  methods: {
    openPanel() {
      this.showPanel = true
      this.hasOpened = true

      if (!this.mapLoaded) {
        this.$nextTick(() => {
          this.$refs.mapDirections.getLocation()
          this.mapLoaded = true
        })
      }
    }
  }
}
</script>

<style>
#toilet-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
#toilet-button:hover {
    background-color: #0056b3;
    cursor: pointer;
}
#toilet-offcanvas {
    min-width: 50rem;
}

@media(max-width: 1024px) {
    #toilet-offcanvas {
        min-width: 35rem;
    }
}

@media(max-width: 768px) {
    #toilet-offcanvas {
        min-width: 100%;
    }

    #toilet-button {
        width: 50px;
        height: 50px;
        font-size: 20px;
    }
}
</style>
