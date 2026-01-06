<template>
  <div>
    <div v-if="user">
      <b-img :src= imageUrl(user.profilePicture) fluid alt="Profile Picture" class="profile-picture" @error="profilePictureError"></b-img>
        <b-card style="max-width: 400px" horizontal header="User Info">
          <b-list-group >
            <b-list-group-item flush variant="primary" class="d-flex"><span class="me-5">Username: {{user.userName}}</span><b-button v-if="currentUserId && id !== currentUserId" size="sm" class="ml-auto" @click="toggleFollowUser">{{ currentUserFollows ? 'Unfollow' : 'Follow' }}</b-button></b-list-group-item>
            <b-list-group-item flush variant="primary">Email: {{user.email}}</b-list-group-item>
            <b-list-group-item flush variant="primary">Adress: {{user.street}} {{ user.streetNumber}}</b-list-group-item>
            <b-list-group-item flush variant="primary">Postal code: {{user.postalCode}}</b-list-group-item>
            <b-list-group-item flush variant="primary">City: {{user.city}}</b-list-group-item>
            <b-list-group-item flush variant="primary">Following: {{user.follows.length}} people</b-list-group-item>
            <b-list-group-item flush variant="primary" >Number of review written: {{user.reviewsWritten.length}}</b-list-group-item>
            <b-list-group-item flush variant="primary" class="d-flex"><span class="me-5">Alcoholic intake: {{ user.alcoholConsumed.length }}</span><b-button v-if="currentUserId && id === currentUserId" size="sm" class="ml-auto" @click="openAddEntryPopup">Add alcoholic entry</b-button></b-list-group-item>
            <b-list-group-item flush variant="primary">How many drinks tried: {{user.triedDrinks.length}}</b-list-group-item>
            <b-list-group-item flush variant="primary" class="d-flex" v-for="followedUser in userFollowingList" :key="followedUser.email">{{ user.userName }} follows: {{ followedUser.userName }}</b-list-group-item>
            <b-list-group-item flush variant="primary" v-if="this.favoriteSystembolag">Favorite systembolag: {{ this.favoriteSystembolag }}</b-list-group-item>
          </b-list-group>
        </b-card>
        <b-list-group>
        <h2 style="text-align: left">Reviews</h2>
        <b-card v-for="review in reviewsByUser" :key="review._id" style="max-width: 600px">
          <b-row>
          <b-col>
            <b-img :src= imageUrl(review.image) fluid alt="bottle image"  style="max-width: 300px; max-height: 300px; display:block;" @error="drinkPictureError"></b-img>
          </b-col>
          <b-col>
            <b-list-group style="max-width: 300px">
              <b-list-group-item flush variant="primary">Name: {{ review.drink }}</b-list-group-item>
              <b-list-group-item flush variant="primary">User Rating: {{ review.rating }}</b-list-group-item>
              <b-list-group-item flush variant="primary">Average Rating: {{ review.avgrating }}</b-list-group-item>
              <b-list-group-item flush variant="primary">Review: {{ review.comment }}</b-list-group-item>
            </b-list-group>
          </b-col>
          </b-row>
        </b-card>
      </b-list-group>

      <b-button block v-if="currentUserId && id === currentUserId" type="button" variant="login" @click="goToEdit()">Edit Profile</b-button>
        <b-modal v-model="addEntryPopup" title="Add alcoholic entry" hide-footer>
          <b-form @submit.prevent="submitAlcoholEntry">
            <b-form-group label="Volume (ml)">
              <b-form-input v-model.number="alcVolume" type="number" min="0" required />
            </b-form-group>
            <b-form-group label="Alcohol % (0–100)">
              <b-form-input v-model.number="alcPercent" type="number" min="0" max="100" required />
            </b-form-group>
            <b-button type="submit" variant="primary" class="mr-2">Save</b-button>
            <b-button variant="secondary" @click="addEntryPopup = false">Cancel</b-button>
          </b-form>
        </b-modal>
        <!-- Toilet prompt popup-->
        <b-modal v-model="showTwoLiterPopup" title="Bathroom time" hide-footer>
          <p>You have logged over 2 liters since last time.</p>
          <b-button class="mr-2" variant="primary" @click="showTwoLiterPopup = false; $refs.toiletPanel.openPanel()">Find toilet</b-button>
          <b-button variant="secondary" @click="showTwoLiterPopup = false">Cancel</b-button>
        </b-modal>
        <ToiletPanel ref="toiletPanel" />
    </div>
  </div>
</template>

<script>
import { drinkApi } from '@/Api'
import ToiletPanel from '@/components/ToiletMap.vue'

export default {
  name: 'users',
  components: { ToiletPanel },
  data() {
    return {
      user: null,
      userFollowingList: [],
      reviewsByUser: [],
      currentUserId: null,
      currentUserFollows: false,
      favoriteSystembolag: null,
      show: false,
      addEntryPopup: false,
      alcVolume: null,
      alcPercent: null,
      showTwoLiterPopup: false,
      twoLiterBaselineTotalMl: 0
    }
  },
  props: {
    id: {
      type: String,
      default: null
    }
  },
  methods: {
    getUserInfo() {
      drinkApi.get('/users/' + this.id)
        .then(response => {
          this.user = response.data
          if (!this.user.profilePicture) {
            this.user.profilePicture = '/profilePictures/default_user.jpg'
          }

          const currentTotalMl = this.user.alcoholConsumed.reduce((sum, entry) => sum + (Number(entry.volume) || 0), 0)
          const totalConsumedKey = `twoLiterBaselineTotalMl:${this.user._id}`
          const savedBaseline = localStorage.getItem(totalConsumedKey)

          if (savedBaseline !== null) {
            this.twoLiterBaselineTotalMl = Number(savedBaseline)
          } else {
            this.twoLiterBaselineTotalMl = currentTotalMl
          }

          this.getUserFollowingList()
          this.getAllUserReviews()
          this.getFavoriteSystembolag()
        })
        .catch(error => {
          this.message = error
        })
    },
    getUserFollowingList() {
      drinkApi.get(this.user._links.follows)
        .then(response => {
          this.userFollowingList = response.data.follows
        })
        .catch(error => {
          this.message = error
        })
    },
    getFavoriteSystembolag() {
      drinkApi.get(this.user._links.favoritesSystembolag)
        .then(response => {
          if (response.data.favoriteSystembolag) {
            const systembolag = response.data
            this.favoriteSystembolag = systembolag.favoriteSystembolag.name
          } else {
            this.favoriteSystembolag = 'No favorite'
          }
        })
        .catch(error => {
          this.message = error
        })
    },
    goToEdit() {
      this.$router.push({ path: '/users/' + this.currentUserId + '/edit' })
    },
    fetchCurrentUser() {
      drinkApi.get('/sessions/currentlyLoggedin/')
        .then(response => {
          this.currentUserId = response.data.user._id
          this.currentUserFollows = response.data.user.follows.includes(this.user._id)
        })
        .catch(error => {
          this.message = error
        })
    },
    async getAllUserReviews() {
      this.reviewsByUser = []
      try {
        const response = await drinkApi.get('/users/' + this.user._id + '/reviews')
        const allReviews = response.data.reviewedBy
        for (const review of allReviews) {
          if (review.userID === this.user._id) {
            const drinkResponse = await drinkApi.get('/drinks/' + review.productID)
            this.drink = drinkResponse.data
            const avgRating = await this.getAverageScore(this.drink._id)
            this.reviewsByUser.push({
              drink: this.drink.name,
              image: this.drink.image,
              comment: review.comment,
              rating: review.rating,
              avgrating: avgRating
            })
          }
        }
      } catch (error) {
        this.message = error
      }
    },
    async getAverageScore(drink) {
      let avgScore = 0
      try {
        const response = await drinkApi.get('/drinks/' + drink + '/reviews')
        const drinkReviews = response.data.reviewForDrink
        let reviewCounter = 0
        let totalScore = 0
        for (const review of drinkReviews) {
          if (review.rating != null) {
            reviewCounter += 1
            totalScore += review.rating
          }
          if (reviewCounter > 0) {
            avgScore = totalScore / reviewCounter
          } else {
            avgScore = 'No score'
          }
        }
      } catch (error) {
        console.error(error)
      }
      return avgScore
    },
    profilePictureError(event) {
      event.target.src = this.imageUrl('/profilePictures/default_user.jpg')
    },
    drinkPictureError(event) {
      event.target.src = this.imageUrl('/drinkPictures/default_drink.jpg')
    },
    imageUrl(image) {
      const imagePath = `../assets${image}`
      return new URL(imagePath, import.meta.url).href
    },
    openAddEntryPopup() {
      this.addEntryPopup = true
    },
    submitAlcoholEntry() {
      if (this.alcVolume <= 0 || this.alcPercent < 0 || this.alcPercent > 100) return
      drinkApi.post(`/users/${this.user._id}/alcoholConsumed`, {
        volume: this.alcVolume,
        percent: this.alcPercent
      })
        .then(res => {
          this.user.alcoholConsumed.push(res.data)

          const currentTotalMl = this.user.alcoholConsumed.reduce((sum, entry) => sum + (Number(entry.volume) || 0), 0)
          const mlSinceLastPrompt = currentTotalMl - this.twoLiterBaselineTotalMl

          if (mlSinceLastPrompt >= 2000) {
            this.showTwoLiterPopup = true
            this.twoLiterBaselineTotalMl = currentTotalMl

            localStorage.setItem(`twoLiterBaselineTotalMl:${this.user._id}`, String(currentTotalMl))
          }

          this.addEntryPopup = false
        })
        .catch(error => {
          this.message = error
        })
    },

    async toggleFollowUser() {
      try {
        if (!this.currentUserFollows) {
          await drinkApi.patch(`/users/${this.currentUserId}/follows/${this.user._id}`)
        } else {
          await drinkApi.delete(`/users/${this.currentUserId}/follows/${this.user._id}`)
        }
        this.currentUserFollows = !this.currentUserFollows
      } catch (error) {
        console.error('Error toggling follow status:', error)
      }
    }
  },
  mounted() {
    this.fetchCurrentUser()
    this.getUserInfo()
  }
}
</script>

<style>
  .list-group-item {
    text-align: left;
  }
  .profile-picture {
    max-width: 600px;
    max-height: 450px;
    margin-left: 0px;
    display:block;
  }
</style>
