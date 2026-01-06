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
            <MapDirections
              v-if="hasOpened"
              ref="mapDirections"
              location="toilets"
              @loading-change="isLoading = $event"
              @mounted="onMapMounted"
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
