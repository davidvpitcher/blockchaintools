<template>
  <div class="tool-page">
    <h1>Tool 17</h1>
    <p>This tool assigns labels to wallet addresses based on the provided spreadsheet data.</p>
    <div>
      <label for="exchange-input">Enter additional exchange names (comma-separated):</label>
      <input type="text" id="exchange-input" v-model="extraExchanges" />
    </div>
    <div>
      <label for="addresses-input">Enter wallet addresses (one per line):</label>
      <textarea id="addresses-input" v-model="addressesInput" rows="10" cols="30"></textarea>
    </div>
    <p>You must put this info into columns A-J: [Column A][Column B][Column C][Column D][Column E][Column F][Column G][Column H][Column I][Column J]</p>
    <div class="spreadsheet-wrapper">
      <SpreadsheetComponent ref="spreadsheet1" buttonLabel="Add 100 Rows to Spreadsheet 1" width="800px" height="300px" />
    </div>
    <div class="button-wrapper">
      <button @click="processData">Process Data</button>
      <button @click="clearData">Clear Data</button>
    </div>
    <div class="spreadsheet-wrapper">
      <SpreadsheetComponent ref="spreadsheet2" buttonLabel="Add 100 Rows to Spreadsheet 2" width="800px" height="300px" />
    </div>
  </div>
</template>

<script>
import SpreadsheetComponent from '@/components/SpreadsheetComponent.vue';

export default {
  name: 'Tool17Page',
  components: {
    SpreadsheetComponent
  },
  data() {
    return {
      extraExchanges: '',
      addressesInput: '', // User-supplied addresses as a text input
      exchangeNames: ['Binance', 'Crypto.com', 'Coinbase', 'Kraken'] // Known exchange names
    };
  },
  methods: {
    processData() {
      console.log('Starting processData...');
      const spreadsheet1Data = this.$refs.spreadsheet1.getData();
      console.log('Spreadsheet data:', spreadsheet1Data);

      // Incorporate additional exchange names
      if (this.extraExchanges.trim()) {
        this.exchangeNames.push(...this.extraExchanges.split(',').map(e => e.trim()));
      }
      console.log('Exchange names:', this.exchangeNames);

      // Convert addressesInput to an array of addresses
      const addresses = this.addressesInput.trim().split('\n').map(addr => addr.trim());
      console.log('Addresses:', addresses);

      // Assign labels based on the data
      const labeledAddresses = this.assignLabels(spreadsheet1Data, addresses);

      // Load the labeled addresses into the second spreadsheet
      this.$refs.spreadsheet2.loadData(labeledAddresses);
      console.log('Labeled addresses:', labeledAddresses);
    },
    assignLabels(data, addresses) {
      console.log('Starting assignLabels...');
      const labelMap = new Map();
      const victimAddresses = new Map();
      const suspectAddresses = new Map();
      const allAddresses = new Set(addresses);

      console.log('Initial address list:', Array.from(allAddresses));

      // Phase 1: Label victim addresses
      data.forEach(row => {
        const rowNumber = row[0];
        const address = row[2];
        const notes = row[9];

        // Check if rowNumber is a valid whole number
        if (rowNumber !== undefined && /^\d+$/.test(rowNumber) && address && allAddresses.has(address)) {
          if (!labelMap.has(address)) {
            const exchangeName = this.exchangeNames.find(ex => notes.includes(ex));
            const labelPrefix = exchangeName ? `Victim's ${exchangeName} Address` : `Victim's Address`;
            const labelIndex = exchangeName 
              ? (victimAddresses.get(exchangeName) || 0) + 1
              : (victimAddresses.get('generic') || 0) + 1;

            labelMap.set(address, `${labelPrefix} #${labelIndex}`);

            // Update the counters
            if (exchangeName) {
              victimAddresses.set(exchangeName, labelIndex);
            } else {
              victimAddresses.set('generic', labelIndex);
            }

            console.log(`Assigned ${labelPrefix} #${labelIndex} to ${address}`);
          }
        }
      });

      // Phase 2: Label suspect addresses
      data.forEach(row => {
        const rowNumber = row[0];
        const address = row[2];
        const notes = row[9];

        // Process only non-integer row numbers
        if (rowNumber === undefined || !/^\d+$/.test(rowNumber) && address && allAddresses.has(address)) {
          if (!labelMap.has(address)) {
            const exchangeName = this.exchangeNames.find(ex => notes.includes(ex));
            const labelPrefix = exchangeName ? `Suspect's ${exchangeName} Address` : `Suspect's Address`;
            const labelIndex = exchangeName 
              ? (suspectAddresses.get(exchangeName) || 0) + 1
              : (suspectAddresses.get('generic') || 0) + 1;

            labelMap.set(address, `${labelPrefix} #${labelIndex}`);

            // Update the counters
            if (exchangeName) {
              suspectAddresses.set(exchangeName, labelIndex);
            } else {
              suspectAddresses.set('generic', labelIndex);
            }

            console.log(`Assigned ${labelPrefix} #${labelIndex} to ${address}`);
          }
        }
      });

      // Phase 3: Label remaining addresses
      let genericSuspectIndex = suspectAddresses.get('generic') || 0;
      allAddresses.forEach(address => {
        if (!labelMap.has(address)) {
          genericSuspectIndex += 1;
          labelMap.set(address, `Suspect's Address #${genericSuspectIndex}`);
          console.log(`Assigned Suspect's Address #${genericSuspectIndex} to ${address}`);
        }
      });

      // Prepare the output data
      const labeledAddresses = Array.from(labelMap.entries()).map(([address, label]) => [address, label]);
      return labeledAddresses;
    },
    clearData() {
      this.$refs.spreadsheet1.loadData(Array(100).fill().map(() => Array(10).fill('')));
      this.$refs.spreadsheet2.loadData(Array(100).fill().map(() => Array(2).fill('')));
    }
  }
};
</script>

<style>
.tool-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.spreadsheet-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

.button-wrapper {
  display: flex; 
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
}
</style>
