<template>
  <div>
    <b-card
      :title="location.name"
      tag="location"
      class="mb-2">
      <b-card-body>
        <b-card-subtitle v-if=location.branch>Branch: {{ location.branch }}<br><br></b-card-subtitle>
        <b-card-subtitle>Open hours:</b-card-subtitle>
        <b-card-text class="white-space-pre-wrap">{{ formattedOpenHours }}</b-card-text>

        <b-card-text class="white-space-pre-wrap"> {{ locationAddress }}</b-card-text>
      </b-card-body>
      <b-button
        @click="setTargetLocation()"
        variant="primary">
        Get directions
      </b-button>
      <b-button
        v-if="userId"
        id="fav-button"
        @click="favoriteSystembolag()"
        :variant="isFavorite ? 'secondary' : 'primary'">
        {{ isFavorite ? 'Unfavorite' : 'Favorite' }}
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
      default: null
    },
    currentFavoriteId: {
      type: Number,
      default: null
    }
  },
  computed: {
    isFavorite() {
      return this.location.id === this.currentFavoriteId
    },
    formattedOpenHours() {
      if (!this.location.openHours) return ''
      return this.location.openHours
        .split(/[,;]+/)
        .map(hoursEntry => hoursEntry.trim())
        .join('\n')
    },
    locationAddress() {
      if (!this.location.street) return ''
      return `Address:\n${this.location.street} ${this.location.streetNumber}\n${this.location.city}, ${this.location.postalCode}`
    }
  },
  data() {
    return {
      message: ''
    }
  },
  methods: {
    async favoriteSystembolag() {
      try {
        if (!this.isFavorite) {
          await Api.put(`/users/${this.userId}/favorites/systembolag/${this.location.id}`)
          this.$emit('favorite-updated', this.location.id)
        } else {
          await Api.delete(`/users/${this.userId}/favorites/systembolag/${this.location.id}`)
          this.$emit('favorite-updated', null)
        }
      } catch (error) {
        this.message = error
      }
    },
    setTargetLocation() {
      this.$emit('select-location', this.location)
    }
  }
}
</script>

<style>
.white-space-pre-wrap {
  white-space: pre-wrap;
}
</style>
