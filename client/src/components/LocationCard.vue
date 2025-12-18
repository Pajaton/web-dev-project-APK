<template>
  <div>
    <b-card
      :title="location.name"
      tag="location"
      style="max-width: 20rem"
      class="mb-2">
      <b-card-body>
        <b-card-sub-title v-if=location.branch>Branch: {{ location.branch }}<br><br></b-card-sub-title>
        <b-card-sub-title>Open hours:</b-card-sub-title>
        <b-card-text class="white-space-pre-wrap">{{ formattedOpenHours }}</b-card-text>

        <b-card-text class="white-space-pre-wrap"> {{ locationAddress }}</b-card-text>
      </b-card-body>
      <b-button
        @click="setTargetLocation()"
        variant="primary">
        Get directions
      </b-button>
      <b-button
          id="fav-button"
          @click="favoriteSystembolag()"
          variant="primary">
        Favorite
      </b-button>
    </b-card>
  </div>
</template>

<script>
  import { Api } from '@/Api'
  export default {
    props: {
      location: {
        type: Object,
        default: () => ({})
      },
      userId: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        formattedOpenHours: "",
        locationAddress: ""
      }
    },
    mounted() {
      this.formatOpenHours(),
      this.formatAddress()
    },
    methods: {
      favoriteSystembolag() {
        Api.put(`/users/${this.userId}/favorites/systembolag/${this.location.id}`)
      },

      setTargetLocation() {
        this.$emit('select-location', this.location)
      },

      formatOpenHours() {
        if (this.location.openHours) {
          // since both commas and semi-colons appear as separators, split by regex pattern
          const weekdays = this.location.openHours.split(/[,;]+/)

          weekdays.forEach(entry => {
            this.formattedOpenHours += entry.trim() + '\n'
          })
        }
      },

      formatAddress() {
        if (this.location.address && this.location.address.street !== undefined) {
          const address = this.location.address
          this.locationAddress += `Address:\n${address.street} ${address.streetNumber}\n${address.city}, ${address.postalCode}`
        }
      }
    }
  }
</script>

<style>
.white-space-pre-wrap {
  white-space: pre-wrap;
}
</style>
