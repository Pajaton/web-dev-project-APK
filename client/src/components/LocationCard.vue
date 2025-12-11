<template>
  <div>
    <b-card
      title="Systembolag"
      tag="systembolag"
      style="max-width: 20rem"
      class="mb-2">
      <b-card-text>
        Enter text here :)
      </b-card-text>
      <b-button
        @click="setTargetLocation()"
        variant="primary">
        Get directions
      </b-button>
    </b-card>
  </div>
</template>

<script>
  export default {
    props: {
      systembolag: {
        type: Object,
        default: () => ({})
      }
    },
    methods: {
      setTargetLocation() {
        this.$emit('select-location', this.systembolag)
      }
    }
  }
</script>

<style>

</style>
