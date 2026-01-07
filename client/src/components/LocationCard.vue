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

/**
 * @component LocationCard
 * @description Displays a Systembolaget store location card with details,
 * directions button, and favorite functionality.
 * @emits {number|null} favorite-updated - Emitted when favorite status changes.
 * @emits {Object} select-location - Emitted when user requests directions to this location.
 */
export default {
  props: {
    /** @type {Object} The Systembolaget location object with name, address, hours, etc. */
    location: {
      type: Object,
      default: () => ({})
    },
    /** @type {string|null} The current user's ID, null if not logged in. */
    userId: {
      type: String,
      default: null
    },
    /** @type {number|null} The ID of the user's current favorite Systembolag. */
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
      message: '',
    }
  },
  methods: {
    /**
     * @description Toggles the favorite status of this Systembolaget store.
     * Adds or removes from user's favorites via API call.
     */
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

    /**
     * @description Emits the location data to parent for map directions.
     */
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
