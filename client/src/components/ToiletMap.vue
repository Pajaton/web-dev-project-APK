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
            <div id="toilet-info" v-if="targetToilet !== null">
              <b-list-group flush>
                <b-list-group-item>
                  <div class="fw-bold">Toilet at: {{ targetToilet.street }}</div>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.directions">
                  <div class="fw-bold">At the location: {{ targetToilet.directions }}</div>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.comment">
                  <div class="fw-bold">Comment: {{ targetToilet.comment }}</div>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.unisex">
                  <div class="fw-bold">{{ targetToilet.unisex ? 'The toilet is unisex' : 'The toilet is gendered' }}</div>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.accessible">
                  <div class="fw-bold">{{ targetToilet.accessible ? 'The toilet is accessible' : 'The toilet is not accessible' }}</div>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.changingTable">
                  <div class="fw-bold">{{ targetToilet.changingTable ? 'The toilet has a changing table' : 'The toilet does not have a changing table' }}</div>
                </b-list-group-item>
                <b-list-group-item v-if="targetToilet.upvotes !== undefined && targetToilet.downvotes !== undefined">
                  <div class="fw-bold">Upvotes: {{ targetToilet.upvotes }}<br>Downvotes: {{ targetToilet.downvotes }}</div>
                </b-list-group-item>
              </b-list-group>
            </div>
            <MapDirections
              v-if="hasOpened"
              ref="mapDirections"
              location="toilets"
              @loading-change="isLoading = $event"
              @mounted="onMapMounted"
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
    },
    onMapMounted() {
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
