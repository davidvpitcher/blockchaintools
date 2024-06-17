<template>
  <div class="tool-page">
    <h1>Spreadsheet Tool</h1>
    <p>This is to help you with spreadsheets. It will translate columns from one sheet to another however you like.</p>
    <div class="spreadsheet-wrapper">
      <SpreadsheetComponent ref="spreadsheet1" buttonLabel="Add 100 Rows to Spreadsheet 1" width="800px" height="300px" />
    </div>
    <div class="button-wrapper">
      <button @click="applyRules">Apply Rules</button>
      <button @click="clearData">Clear Data</button>
    </div>
    <div class="spreadsheet-wrapper">
      <SpreadsheetComponent ref="spreadsheet2" buttonLabel="Add 100 Rows to Spreadsheet 2" width="800px" height="300px" />
    </div>
    <h2>Transformation Rules</h2>
    <div class="rules-wrapper">
      <label>
        Spreadsheet 1 Column:
        <input v-model="rule.sourceColumn" placeholder="A" />
      </label>
      <label>
        Spreadsheet 2 Column:
        <input v-model="rule.targetColumn" placeholder="B" />
      </label>
      <button @click="addRule">Add Rule</button>
    </div>
    <ul class="rules-list">
      <li v-for="(r, index) in rules" :key="index">
        <span>{{ r.sourceColumn }} -> {{ r.targetColumn }}</span>
        <button @click="removeRule(index)">Remove</button>
      </li>
    </ul>
  </div>
</template>

<script>
import SpreadsheetComponent from '@/components/SpreadsheetComponent.vue';
import axios from 'axios';

export default {
  name: 'Tool1Page',
  components: {
    SpreadsheetComponent
  },
  data() {
    return {
      rule: {
        sourceColumn: '',
        targetColumn: ''
      },
      rules: []
    };
  },
  created() {
    this.loadRules();
  },
  methods: {
    addRowsToSpreadsheet1() {
      this.$refs.spreadsheet1.addRows();
    },
    addRule() {
      if (this.rule.sourceColumn && this.rule.targetColumn) {
        const newRule = { ...this.rule };
        this.rules.push(newRule);
        this.rule.sourceColumn = '';
        this.rule.targetColumn = '';
        this.saveRuleToDB(newRule);
      }
    },
    removeRule(index) {
      const ruleToRemove = this.rules[index];
      this.rules.splice(index, 1);
      this.removeRuleFromDB(ruleToRemove);
    },
    applyRules() {
      const spreadsheet1Data = this.$refs.spreadsheet1.getData();
      const spreadsheet2Data = Array(spreadsheet1Data.length).fill().map(() => Array(26).fill('')); // Assuming max 26 columns in spreadsheet2

      this.rules.forEach(rule => {
        const sourceIndex = this.columnLetterToIndex(rule.sourceColumn);
        const targetIndex = this.columnLetterToIndex(rule.targetColumn);

        spreadsheet1Data.forEach((row, rowIndex) => {
          if (row[sourceIndex] !== undefined) {
            spreadsheet2Data[rowIndex][targetIndex] = row[sourceIndex];
          }
        });
      });

      this.$refs.spreadsheet2.loadData(spreadsheet2Data);
    },
    clearData() {
      this.$refs.spreadsheet1.loadData(Array(100).fill().map(() => Array(26).fill('')));
      this.$refs.spreadsheet2.loadData(Array(100).fill().map(() => Array(26).fill('')));
    },
    saveRuleToDB(rule) {
      axios.post('/etherscan/save_rule.php', { rule })
        .then(response => {
          if (response.data.status !== 'success') {
            alert('Failed to save rule');
          }
        })
        .catch(error => {
          console.error('Error saving rule:', error);
        });
    },
    removeRuleFromDB(rule) {
      axios.post('/etherscan/remove_rule.php', { rule })
        .then(response => {
          if (response.data.status !== 'success') {
            alert('Failed to remove rule');
          }
        })
        .catch(error => {
          console.error('Error removing rule:', error);
        });
    },
    loadRules() {
      axios.get('/etherscan/load_rules.php')
        .then(response => {
          if (response.data.status === 'success') {
            this.rules = response.data.rules;
          } else {
            alert('Failed to load rules');
          }
        })
        .catch(error => {
          console.error('Error loading rules:', error);
        });
    },
    columnLetterToIndex(letter) {
      return letter.charCodeAt(0) - 65;
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

.rules-wrapper {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
}

.rules-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rules-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  margin: 0; /* Remove default margin */
  padding: 2px 0; /* Reduce padding */
}

.rules-list li button {
  padding: 2px 5px; /* Smaller padding */
  font-size: 12px;
}

.spreadsheet-container {
  margin: 20px;
  border: 1px solid #ccc; /* Add border to see the container */
  overflow: hidden; /* Ensure overflow is handled */
  width: auto; /* Adjust width */
}

button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  font-size: 16px;
}
</style>
