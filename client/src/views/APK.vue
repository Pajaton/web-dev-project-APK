<template>
    <!-- APK HTML template -->
    <div>
        <form @submit.prevent="submitFilter">
            <p>Filter for drinks:</p>
            
            <ul class="filter-list">
                <li>
                    <label>
                        <input 
                            type="radio" 
                            name="drink-filter" 
                            value="type"
                            v-model="selectedFilter">
                        Type of beverage
                            <input
                                v-if="selectedFilter === 'type'"
                                type="text"
                                v-model="typeText"
                                placeholder="Enter beverage type"
                            />
                            <button 
                                v-if="selectedFilter  === 'type'"
                                type="submit">
                            Get drinks</button>
                    </label>
                </li>
                <li>
                    <label>
                        <input
                            type="radio" 
                            name="drink-filter" 
                            value="percentage"
                            v-model="selectedFilter">
                        Alcohol percentage
                            <input
                                v-if="selectedFilter === 'percentage'"
                                type="text"
                                v-model="percentageText"
                                placeholder="Enter alcohol percentage"
                            />
                            <button 
                                v-if="selectedFilter  === 'percentage'"
                                type="submit">
                            Get drinks</button>
                    </label>
                </li>
                <li>
                    <label>
                        <input
                            type="radio" 
                            name="drink-filter" 
                            value="price"
                            v-model="selectedFilter">
                        Price
                            <input
                                v-if="selectedFilter === 'price'"
                                type="text"
                                v-model="priceText"
                                placeholder="Enter price"
                            />
                            <button 
                                v-if="selectedFilter  === 'price'"
                                type="submit">
                            Get drinks</button>
                    </label>
                </li>
                <li>
                    <label>
                        <input
                            type="radio" 
                            name="drink-filter" 
                            value="apk"
                            v-model="selectedFilter">
                        Alcohol per krona
                            <input
                                v-if="selectedFilter === 'apk'"
                                type="text"
                                v-model="apkText"
                                placeholder="Enter APK value"
                            />
                            <button 
                                v-if="selectedFilter  === 'apk'"
                                type="submit">
                            Get drinks</button>
                    </label>
                </li>
            </ul>
        </form>
        <!--      <button @click="getMessage">Load drinks</button>
        <pre>{{ message }}</pre>     -->

    </div>
</template>


<script>

import { drinkApi } from '@/Api'

    // APK view behavior
export default {
    name: 'APK',
    data() {
        return {
            message: 'none',
            selectedFilter: '',
            typeInput: false,
            typeText: '',
            percentageText: '',
            priceText: '',
            apkText: ''
    }
  },
  methods: {
    getMessage() {
      drinkApi.get('/drinks')
        .then(response => {
          this.message = JSON.stringify(response.data, null, 2)
        })
        .catch(error => {
          this.message = error
        })
    },
    submitFilter() {
        let valueToUse = '' 
        if (this.selectedFilter === 'type') {
          valueToUse = this.typeText
        } else if (this.selectedFilter === 'percentage') {
          valueToUse = this.percentageText
        } else if (this.selectedFilter === 'price') {
          valueToUse = this.priceText
        } else if (this.selectedFilter === 'apk') {
          valueToUse = this.apkText
        }
        console.log('Selected filter:', this.selectedFilter)
        console.log('Input value:', valueToUse)
    },
    showTypeInput() {
        typeInput = true
    }
  }
}
</script>

<style>
    .filter-list label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .filter-list {
        list-style: none;
    }
</style>