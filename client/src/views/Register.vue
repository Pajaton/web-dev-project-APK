<template>
  <!-- Register HTML template -->
  <div>
    <p>Register</p>
    <BForm>
        <BFormFloatingLabel
        label="Email address"
        label-for="floatingEmail"
        class="my-2"
      >
        <BFormInput
          id="floatingEmail"
          v-model="email"
          type="email"
          placeholder="Email address"
        />
        </BFormFloatingLabel>
                <BFormFloatingLabel
        label="User Name"
        label-for="floatingUserName"
        class="my-2"
      >
        <BFormInput
          id="floatingName"
          v-model="UserName"
          type="text"
          placeholder="UserName"
        />
        </BFormFloatingLabel>
                <BFormFloatingLabel
        label="Street"
        label-for="floatingStreet"
        class="my-2"
      >
        <BFormInput
          id="floatingStreet"
          v-model="street"
          type="text"
          placeholder="street"
        />
        </BFormFloatingLabel>
        <BFormFloatingLabel
        label="StreetNumber"
        label-for="floatingStreetNumber"
        class="my-2"
      >
        <BFormInput
          id="floatingStreetNumber"
          v-model="streetNumber"
          type="text"
          placeholder="streetNumber"
        />
        </BFormFloatingLabel>
        <BFormFloatingLabel
        label="postalCode"
        label-for="floatingpostalCode"
        class="my-2"
      >
        <BFormInput
          id="floatingpostalCode"
          v-model="postalCode"
          type="text"
          placeholder="postalCode"
        />
        </BFormFloatingLabel>
        <BFormFloatingLabel
        label="city"
        label-for="floatingcity"
        class="my-2"
      >
        <BFormInput
          id="floatingcity"
          v-model="city"
          type="text"
          placeholder="city"
        />
        </BFormFloatingLabel>
    </BForm>
    <b-button block variant="danger" @click="resetFields()">Reset</b-button>
    <b-button block @click="registerUser()">Register</b-button>

    </div>
</template>

<script>
// Register view behavior

import { drinkApi } from '@/Api'

export default {
  name: 'Register',
  data() {
    return {
      message: 'none',
      email: '',
      UserName: '',
      street: '',
      streetNumber: '',
      postalCode: '',
      city: '',
      userExist: false
    }
  },
  methods: {
    async registerUser() {
      this.userVerification()
      if (this.userExist === false) {
        drinkApi.post('/users', {
          email: this.email,
          ProfilePicture: null,
          userName: this.UserName,
          street: this.street,
          streetNumber: this.streetNumber,
          postalCode: this.postalCode,
          city: this.city,
          longitude: null,
          latitude: null
        })
      }
      console.log('User added: ' + this.userName + ' ' + ' Email: ' + this.email)
    },
    resetFields() {
      this.email = ''
      this.UserName = ''
      this.street = ''
      this.streetNumber = ''
      this.postalCode = ''
      this.city = ''
    },
    async userVerification() {
      const response = await drinkApi('/users/')
      const data = response.data
      data.users.forEach(user => {
        if (user.email === this.email) {
          this.userExist = true
        }
      })
    }
  }
}
</script>

<style>
    /* Find Systembolag CSS styles */
</style>
