<template>
  <div>
    <div class="spreadsheet-container" ref="spreadsheetContainer"></div>
    <button @click="addRows">{{ buttonLabel }}</button>
  </div>
</template>

<script>
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';

export default {
  name: 'SpreadsheetComponent',
  props: {
    buttonLabel: {
      type: String,
      required: true
    },
    width: {
      type: String,
      default: '800px'
    },
    height: {
      type: String,
      default: '400px'
    }
  },
  data() {
    return {
      hotInstance: null
    };
  },
  mounted() {
    console.log('SpreadsheetComponent mounted');
    this.hotInstance = new Handsontable(this.$refs.spreadsheetContainer, {
      data: Array(100).fill().map(() => Array(26).fill('')), // Start with 100 empty rows
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      manualRowResize: true,
      manualColumnResize: true,
      minRows: 100,
      minCols: 26,
      colWidths: 100, // Set a default column width
      width: this.width,
      height: this.height,
      licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
    });
    console.log('Handsontable instance created:', this.hotInstance);

    this.$refs.spreadsheetContainer.addEventListener('paste', this.onPaste);
  },
  beforeUnmount() {
    console.log('SpreadsheetComponent beforeUnmount');
    if (this.hotInstance) {
      this.hotInstance.destroy();
    }
  },
  methods: {
    onPaste(event) {
      const clipboardData = event.clipboardData || window.clipboardData;
      const pastedData = clipboardData.getData('Text');
      this.parsePastedData(pastedData);
    },
    parsePastedData(pastedData) {
      const rows = pastedData.split('\n');
      const parsedData = rows.map(row => row.split('\t'));
      console.log('Parsed pasted data:', parsedData);
      this.hotInstance.loadData(parsedData);
    },
    addRows() {
      const currentData = this.hotInstance.getData();
      const newData = currentData.concat(Array(100).fill().map(() => Array(26).fill('')));
      this.hotInstance.loadData(newData);
    },
    getData() {
      return this.hotInstance.getData();
    },
    loadData(data) {
      this.hotInstance.loadData(data);
    }
  }
};
</script>

<style>
.spreadsheet-container {
  margin: 20px;
  border: 1px solid #ccc; /* Add border to see the container */
  overflow: hidden; /* Ensure overflow is handled */
}
button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  font-size: 16px;
}
</style>
