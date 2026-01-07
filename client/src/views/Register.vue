<template>
  <!-- Register HTML template -->
  <div>
    <BFormGroup class="register-wrapper my-2 px-2 px-md-0">
    <h2>Register</h2>
    <BForm class="px-0 px-md-4">
      <BFormFloatingLabel label="Email Address" label-for="floatingEmail">
        <BFormInput
        id="floatingEmail"
        v-model="email"
        type="email"
        placeholder="Email address"
        :state="emailState"
        aria-describedby="email-feedback"
        />
        <b-form-invalid-feedback id="email-feedback">
          Enter a valid email
        </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="User Name" label-for="floatingUserName">
      <BFormInput
        id="floatingUserName"
        v-model="userName"
        type="text"
        placeholder="UserName"
        :state="nameState"
        aria-describedby="userName-feedback"
      />
      <b-form-invalid-feedback id="userName-feedback">
        Enter at least 5 characters
      </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Password" label-for="floatingPassword">
        <BFormInput
          id="floatingPassword"
          v-model="password"
          type="password"
          placeholder="Password"
          :state="passwordState"
          aria-describedby="password-feedback"
        />
        <b-form-invalid-feedback id="password-feedback">
          Password needs to be at least 8 characters long, with uppercase, lowercase, numbers and special characters.
        </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Street" label-for="floatingStreet">
      <BFormInput
        id="floatingStreet"
        v-model="street"
        type="text"
        placeholder="street"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Street Number" label-for="floatingStreetNumber">
      <BFormInput
        id="floatingStreetNumber"
        v-model="streetNumber"
        type="text"
        placeholder="streetNumber"
        :state="numberState(streetNumber)"
        aria-describedby="streetNumber-feedback"
      />
      <b-form-invalid-feedback id="streetNumber-feedback">
        Only numbers are allowed
      </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Postal Code" label-for="floatingPostalCode">
      <BFormInput
        id="floatingPostalCode"
        v-model="postalCode"
        type="text"
        placeholder="postalCode"
        :state="numberState(postalCode)"
        aria-describedby="postalCode-feedback"
      />
      <b-form-invalid-feedback id="postalCode-feedback">
        Only numbers are allowed
      </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="City" label-for="floatingCity">
      <BFormInput
        id="floatingCity"
        v-model="city"
        type="text"
        placeholder="city"
      />
      </BFormFloatingLabel>
      <b-form-checkbox v-model="ageCheck" inline>I confirm that I am over 20 years old</b-form-checkbox>
      <BAlert :model-value="!!message" :variant="alertVariant" dismissible @dismissed="message=''"> {{ message }} </BAlert>
    </BForm>
      <div class="px-2 px-md-0">
        <div class="d-inline-flex flex-column flex-md-row gap-2 align-items-start justify-content-md-center w-100">
          <b-button variant="danger" @click="resetFields()">Reset</b-button>
          <b-button variant="primary" @click="registerUser()" :disabled="!validForm">Register</b-button>
        </div>
      </div>
    </BFormGroup>
  </div>
</template>

<script>
// Register view behavior

import { Api } from '@/Api'

/**
 * @view Register
 * @description User registration page with form validation.
 * Creates a new user account with email, password, and address information.
 */
export default {
  name: 'Register',
  computed: {
    emailState() {
      return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email)
    },
    nameState() {
      return this.userName.length > 4
    },
    passwordState() {
      return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(this.password)
    },
    validForm() {
      return (this.emailState && this.nameState && this.passwordState && this.numberState(this.streetNumber) && this.numberState(this.postalCode) && this.ageCheck)
    }
  },
  data() {
    return {
      message: '',
      email: '',
      userName: '',
      password: '',
      street: '',
      streetNumber: '',
      postalCode: '',
      city: '',
      userExist: false,
      ageCheck: false,
      alertVariant: 'info'
    }
  },
  methods: {
    /**
     * @description Displays an alert message with specified variant.
     * @param {string} message - The message to display.
     * @param {string} variant - Bootstrap variant (info, success, warning, danger).
     */
    showAlert(message, variant = 'info') {
      this.message = ''
      this.$nextTick(() => {
        this.message = message
        this.alertVariant = variant
      })
    },

    /**
     * @description Validates and registers a new user account.
     * Checks for existing email before creating the account.
     */
    async registerUser() {
      await this.userVerification()
      if (this.userExist) {
        this.showAlert('This email already exist', 'warning')
        return
      }
      try {
        const response = await Api.post('/users', {
          email: this.email,
          ProfilePicture: '/profilePictures/default_user.jpg',
          userName: this.userName,
          password: this.password,
          street: this.street,
          streetNumber: this.streetNumber,
          postalCode: this.postalCode,
          city: this.city,
          longitude: null,
          latitude: null
        })
        if (response.status === 201) {
          this.showAlert('Registration Successfull', 'success')
          setTimeout(() => {
            this.$router.push({ path: '/home' })
          }, 3000)
        } else {
          this.showAlert('Registration failed', 'danger')
        }
      } catch (error) {
        console.error(error)
        this.showAlert('Registration failed, server is unavailable', 'danger')
      }
    },

    /**
     * @description Clears all registration form fields.
     */
    resetFields() {
      this.email = ''
      this.userName = ''
      this.password = ''
      this.street = ''
      this.streetNumber = ''
      this.postalCode = ''
      this.city = ''
      this.ageCheck = false
    },

    /**
     * @description Checks if the email already exists in the system.
     */
    async userVerification() {
      this.userExist = false
      try {
        const response = await Api('/users/')
        const data = response.data
        data.users.forEach(user => {
          console.log('Checking user email:', user.email)

          if (user.email === this.email) {
            this.userExist = true
          }
        })
      } catch (error) {
        console.error('User verification failer:', error)
      }
    },

    /**
     * @description Validates that a value contains only numbers.
     * @param {string} number - The value to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    numberState(number) {
      return /^\d*$/.test(number)
    }
  }
}
</script>

<style>
.register-wrapper {
  max-width: 500px; width: 100%;
  }
</style>
