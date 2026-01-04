<template>
  <!-- Register HTML template -->
  <div>
    <BFormGroup class="my-2">
      <h2>Edit Profile</h2>
      <b-row>
        <BForm style="padding-left: 2rem;">
          <BFormFloatingLabel label="Email address" label-for="floatingEmail" class="my-2">
           <BFormInput
              id="floatingEmail"
              v-model="email"
              type="email"
              :state="emailState"
              aria-describedby="email-feedback"
            />
            <b-form-invalid-feedback id="email-feedback">
              Enter a valid email
            </b-form-invalid-feedback>
          </BFormFloatingLabel>
          <BFormFloatingLabel label="User Name" label-for="floatingUserName" class="my-2">
            <BFormInput
              id="floatingUserName"
              v-model="userName"
              type="text"
              :state="nameState"
              aria-describedby="userName-feedback"
            />
            <b-form-invalid-feedback id="userName-feedback">
              Enter at least 5 characters
            </b-form-invalid-feedback>
          </BFormFloatingLabel>
          <BFormFloatingLabel label="Street" label-for="floatingStreet" class="my-2">
            <BFormInput
              id="floatingStreet"
              v-model="street"
              type="text"
            />
          </BFormFloatingLabel>
          <BFormFloatingLabel label="StreetNumber" label-for="floatingStreetNumber" class="my-2">
            <BFormInput
              id="floatingStreetNumber"
              v-model="streetNumber"
              type="text"
              :state="numberState(streetNumber)"
              aria-describedby="streetNumber-feedback"
            />
            <b-form-invalid-feedback id="streetNumber-feedback">
              Only numbers are alowed
            </b-form-invalid-feedback>
          </BFormFloatingLabel>
          <BFormFloatingLabel label="postalCode" label-for="floatingpostalCode" class="my-2">
            <BFormInput
              id="floatingpostalCode"
              v-model="postalCode"
              type="text"
              :state="numberState(postalCode)"
              aria-describedby="postalCode-feedback"
            />
            <b-form-invalid-feedback id="postalCode-feedback">
              Only numbers are allowed
            </b-form-invalid-feedback>
          </BFormFloatingLabel>
          <BFormFloatingLabel label="city" label-for="floatingcity" class="my-2">
            <BFormInput
              id="floatingcity"
              v-model="city"
              type="text"
            />
          </BFormFloatingLabel>
          <BFormFloatingLabel label="longitude" label-for="floatinglongitude" class="my-2">
            <BFormInput
              id="floatinglongitude"
              v-model="longitude"
              type="text"
              :state="numberState(longitude)"
              aria-describedby="latitude-feedback"
            />
            <b-form-invalid-feedback id="longitude-feedback">
              Only numbers are allowed
            </b-form-invalid-feedback>
          </BFormFloatingLabel>
          <BFormFloatingLabel label="latitude" label-for="floatinglatitude" class="my-2">
            <BFormInput
              id="floatinglatitude"
              v-model="latitude"
              type="text"
              :state="numberState(latitude)"
              aria-describedby="latitude-feedback"
            />
            <b-form-invalid-feedback id="longitude-feedback">
              Only numbers are allowed
            </b-form-invalid-feedback>
          </BFormFloatingLabel>
          <b-img class="images" :src="profilePicture" style="float:left" thumbnail alt="Profile Picture" @error="profilePictureError"></b-img>
          <b-button @click="modalShowPicture = !modalShowPicture">Choose profile picture</b-button>
          <b-modal v-model="modalShowPicture" title="Choose profile picture">
            <b-img class="images" v-for="(picture, index) in profilePictureList"
            :key="index" :src="picture" thumbnail fluid @click="setProfilePicture(picture)">
            </b-img>
          </b-modal>
        </BForm>
        <BAlert :model-value="!!message" :variant="alertVariant" dismissible @dismissed="message=''"> {{ message }} </BAlert>
      </b-row>
      <b-row cols="md" align-h="between">
      <b-col >
        <b-button @click="modalShowDelete = !modalShowDelete">Delete Account</b-button>
        <b-modal v-model="modalShowDelete" title="Delete Account" @ok="deleteUser">
          <p>Are you sure you want to delete your account?</p>
        </b-modal>
      </b-col>
      <b-col >
        <b-button block variant="danger" @click="resetFields()">Reset</b-button>
        <b-button block variant="primary" @click="editUser()" :disabled="!validForm">Edit Profile</b-button>
      </b-col>
    </b-row>
    <b-modal v-model="modalShowConfirmation" title="Account Deleted" @ok="goHome" @hide="goHome">
      <p>You have successfully deleted your account</p>
    </b-modal>
  </BFormGroup>
</div>
</template>

<script>
// Register view behavior

import { drinkApi } from '@/Api'

export default {
  name: 'Register',
  mounted() {
    this.fetchCurrentUser()
  },
  computed: {
    emailState() {
      return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email)
    },
    nameState() {
      return this.userName.length > 4
    },
    validForm() {
      return (
        this.emailState &&
        this.nameState &&
        this.numberState(this.streetNumber) &&
        this.numberState(this.postalCode) &&
        this.numberState(this.latitude) &&
        this.numberState(this.longitude)
      )
    }
  },
  data() {
    return {
      message: '',
      email: '',
      userName: '',
      street: '',
      streetNumber: '',
      postalCode: '',
      city: '',
      longitude: '',
      latitude: '',
      currentUserId: null,
      userInfo: [],
      profilePicture: '',
      modalShowPicture: false,
      modalShowDelete: false,
      modalShowConfirmation: false,
      alertVariant: 'info',
      profilePictureList: [
        '/profilePictures/greger.jpg',
        '/profilePictures/bacchus.jpg',
        '/profilePictures/dionysos.jpg',
        '/profilePictures/freya.jpg',
        '/profilePictures/ellie.jpg',
        '/profilePictures/jules.jpg',
        '/profilePictures/tyrion.jpg',
        '/profilePictures/penny.jpg',
        '/profilePictures/zoro.jpg',
        '/profilePictures/kapten_haddock.jpeg',
        '/profilePictures/malory_archer.jpg',
        '/profilePictures/sterling_archer.jpg',
        '/profilePictures/pam.jpg',
        '/profilePictures/patsy.jpg',
        '/profilePictures/tom.png'
      ]
    }
  },
  methods: {
    showAlert(message, variant = 'info') {
      this.message = ''
      this.$nextTick(() => {
        this.message = message
        this.alertVariant = variant
      })
    },
    async editUser() {
      try {
        const response = await drinkApi.patch('/users/' + this.currentUserId, {
          email: this.email,
          profilePicture: this.profilePicture,
          userName: this.userName,
          street: this.street,
          streetNumber: this.streetNumber,
          postalCode: this.postalCode,
          city: this.city,
          longitude: this.longitude,
          latitude: this.latitude
        })
        if (response.status === 200) {
          this.showAlert('Update Successfull', 'success')
          setTimeout(() => {
            this.$router.push({ path: '/users/' + this.currentUserId })
          }, 3000)
        } else {
          this.showAlert('Update failed', 'danger')
        }
      } catch (error) {
        console.error(error)
        this.showAlert('Update failed, server is unavailable', 'danger')
      }
    },
    async resetFields() {
      try {
        const response = await drinkApi.get('/users/' + this.currentUserId)
        this.userInfo = response.data
        this.email = this.userInfo.email
        this.profilePicture = this.userInfo.profilePicture ?? '/profilePictures/default_user.jpg'
        this.userName = this.userInfo.userName
        this.street = this.userInfo.street
        this.streetNumber = this.userInfo.streetNumber
        this.postalCode = this.userInfo.postalCode
        this.city = this.userInfo.city
        this.longitude = this.userInfo.longitude
        this.latitude = this.userInfo.latitude
      } catch (error) {
        console.error(error)
        this.showAlert('Registration failed, server is unavailable', 'danger')
      }
    },
    setProfilePicture(picture) {
      this.profilePicture = picture
    },
    async deleteUser() {
      try {
        await drinkApi.delete('/sessions/' + this.currentUserId)
        await drinkApi.delete('/users/' + this.currentUserId)
        this.currentUserId = null
        this.modalShowConfirmation = true
        console.log('User deleted: ' + this.userName + ' Email: ' + this.email)
      } catch (error) {
        this.message = error
      }
    },
    async goHome() {
      this.modalShowConfirmation = false
      this.$router.push({ path: '/home' })
    },
    fetchCurrentUser() {
      drinkApi.get('/sessions/currentlyLoggedin/')
        .then(response => {
          this.currentUserId = response.data.user._id
          return this.resetFields()
        })
        .catch(error => {
          this.message = error
        })
    },
    profilePictureError(event) {
      event.target.src = '/profilePictures/default_user.jpg'
    },
    numberState(number) {
      if (number === null) return true
      return /^\d*$/.test(number)
    }
  }
}
</script>

<style>
    /* EditUserProfile CSS styles */
    .images {
      max-width: 150px !important;
    }
    .my-2 {
      max-width: 500px;
    }
</style>
