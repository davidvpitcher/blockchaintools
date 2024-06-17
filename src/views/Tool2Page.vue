<template>
  <div class="tool2-page">
    <h1>Blockchain Transaction Visualization</h1>
    <form @submit.prevent="lookupTransaction">
      <div>
        <label for="txHash">Transaction Hash:</label>
        <input v-model="txHash" type="text" id="txHash" required maxlength="66" />
      </div>
      <button type="submit">Lookup</button>
    </form>
    <button @click="resetZoom">Reset Zoom</button>
    <div id="visualization" ref="visualization"></div>
    <p v-if="statusMessage" class="status-message">{{ statusMessage }}</p>
    <p v-if="copyMessage" class="copy-message">{{ copyMessage }}</p>
    <div class="legend">
      <h3>Legend</h3>
      <p><span class="rect"></span> Transaction Hash</p>
      <p><span class="circle from"></span> From Address</p>
      <p><span class="circle to"></span> To Address</p>
    </div>
    <div class="filters">
      <h3>Filters</h3>
      <label>
        Time Range:
        <input type="date" v-model="startDate" />
        to
        <input type="date" v-model="endDate" />
      </label>
      <label>
        Minimum Value (ETH):
        <input type="number" v-model="minValue" step="0.01" />
      </label>
      <label>
        Specific Address:
        <input type="text" v-model="specificAddress" />
      </label>
      <button @click="applyFilters">Apply Filters</button>
    </div>
    <div v-if="nodeDetails" class="node-details">
      <h3>Node Details</h3>
      <p><strong>Type:</strong> {{ nodeDetails.type }}</p>
      <p><strong>ID:</strong> {{ nodeDetails.id }}</p>
      <button @click="copyToClipboard(nodeDetails.id)">Copy ID to Clipboard</button>
      <p v-if="nodeDetails.amount"><strong>Amount:</strong> {{ nodeDetails.amount }} {{ nodeDetails.tokenSymbol || 'ETH' }}</p>
      <button v-if="nodeDetails.type === 'Address'" @click="fetchTransactionHistory(nodeDetails.id)" :disabled="loading">View Transaction History</button>
    </div>
    <div v-if="transactionHistory.length" class="transaction-history">
      <h3>Transaction History</h3>
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Direction</th>
            <th>From</th>
            <th>To</th>
            <th>Value</th>
            <th>Token Transfers</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in transactionHistory" :key="tx.hash">
            <td>{{ tx.hash }}</td>
            <td>
              <span :class="{'outgoing': tx.direction === 'outgoing', 'incoming': tx.direction === 'incoming'}">
                {{ tx.direction === 'outgoing' ? '↓' : '↑' }}
              </span>
            </td>
            <td>{{ tx.from }}</td>
            <td>{{ tx.to }}</td>
            <td>{{ tx.value / 1e18 }} ETH</td>
            <td>
              <div v-for="transfer in tx.token_transfers" :key="transfer.hash">
                {{ formatTokenAmount(transfer.token_amount, tokenDecimals[transfer.token_symbol] || 18) }} {{ transfer.token_symbol }}
              </div>
            </td>
            <td><button @click="addTransactionToVisualization(tx.hash)" :disabled="loading">Add to Visualization</button></td>
          </tr>
        </tbody>
      </table>
      <button @click="prevPage" :disabled="currentPage === 1 || loading">Previous</button>
      <button @click="nextPage" :disabled="loading">Next</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import * as d3 from 'd3';
import BigNumber from 'bignumber.js';

export default {
  name: 'Tool2Page',
  data() {
    return {
      txHash: '0x7e69e0c5957329dcdd08ad8492e5920931d5f6e2aa790db81f18eba275b50813',
      transactionData: null,
      statusMessage: '',
      copyMessage: '',
      zoom: null,
      svg: null,
      g: null,
      startDate: '',
      endDate: '',
      minValue: 0,
      specificAddress: '',
      nodeDetails: null,
      tokenDecimals: {
        'USDT': 6,
        'WETH': 18,
        'UBAYC': 6,
        'FLC': 18,
        // Add other tokens and their decimals here
      },
      transactionHistory: [],
      currentPage: 1,
      loading: false,
    };
  },
  methods: {
    async lookupTransaction() {
      try {
        const response = await axios.post('/etherscan/etherscanlookup.inc.php', { txHash: this.txHash });
        if (response.data.status === 'success') {
          this.transactionData = response.data.data;
          this.statusMessage = '';
          this.renderVisualization();
        } else {
          this.statusMessage = response.data.message;
          this.transactionData = null;
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
        this.statusMessage = 'An error occurred while fetching the transaction.';
        this.transactionData = null;
      }
    },
    formatTokenAmount(amount, decimals) {
      const amountBig = new BigNumber(amount);
      const divisor = new BigNumber(10).pow(decimals);
      return amountBig.div(divisor).toFixed(decimals); // Full precision without scientific notation
    },
    renderVisualization() {
      if (!this.transactionData) {
        return;
      }

      const width = 800;
      const height = 600;

      // Clear any previous visualization
      d3.select(this.$refs.visualization).selectAll('*').remove();

      this.svg = d3.select(this.$refs.visualization)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      this.g = this.svg.append('g');

      this.zoom = d3.zoom().on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

      this.svg.call(this.zoom);

      const txHash = this.transactionData.tx_hash;
      const fromAddress = this.transactionData.from_address;
      const toAddress = this.transactionData.to_address;
      const amount = this.transactionData.amount;
      const tokenTransfers = this.transactionData.token_transfers;

      // Tooltip div
      const tooltip = d3.select(this.$refs.visualization).append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      const showTooltip = (event, content) => {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(content)
          .style('left', `${event.pageX + 15}px`)
          .style('top', `${event.pageY - 28}px`);
      };

      const hideTooltip = () => {
        tooltip.transition().duration(500).style('opacity', 0);
      };

      const copyToClipboard = async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          this.copyMessage = `Copied ${text.substring(0, 10)}... to clipboard.`;
          setTimeout(() => { this.copyMessage = ''; }, 3000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
      };

      const showNodeDetails = (type, id, amount, tokenSymbol) => {
        this.nodeDetails = { type, id, amount, tokenSymbol };
      };

      // Function to handle drag events
      const drag = d3.drag()
        .on('start', (event) => {
          d3.select(event.sourceEvent.target).raise().classed('active', true);
        })
        .on('drag', (event) => {
          d3.select(event.sourceEvent.target)
            .attr('cx', event.x)
            .attr('cy', event.y)
            .attr('x', event.x)
            .attr('y', event.y);
          updateLinks();
        })
        .on('end', (event) => {
          d3.select(event.sourceEvent.target).classed('active', false);
        });

      // Draw transaction hash
      const txRect = this.g.append('rect')
        .attr('x', 350)
        .attr('y', 50)
        .attr('width', 100)
        .attr('height', 100)
        .attr('fill', '#69b3a2')
        .call(drag)
        .on('mouseover', (event) => showTooltip(event, `Transaction Hash: ${txHash}`))
        .on('mouseout', hideTooltip)
        .on('click', () => {
          copyToClipboard(txHash);
          showNodeDetails('Transaction', txHash, amount, 'ETH');
        });

      this.g.append('text')
        .attr('x', 400)
        .attr('y', 100)
        .attr('text-anchor', 'middle')
        .text(txHash)
        .on('mouseover', (event) => showTooltip(event, `Transaction Hash: ${txHash}`))
        .on('mouseout', hideTooltip)
        .on('click', () => {
          copyToClipboard(txHash);
          showNodeDetails('Transaction', txHash, amount, 'ETH');
        });

      // Display amount
      this.g.append('text')
        .attr('x', 400)
        .attr('y', 150)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(`Amount: ${amount} ETH`);

      // Draw from address
      const fromCircle = this.g.append('circle')
        .attr('cx', 150)
        .attr('cy', 300)
        .attr('r', 50)
        .attr('fill', '#404080')
        .call(drag)
        .on('mouseover', (event) => showTooltip(event, `From Address: ${fromAddress}`))
        .on('mouseout', hideTooltip)
        .on('click', () => {
          copyToClipboard(fromAddress);
          showNodeDetails('Address', fromAddress);
        });

      this.g.append('text')
        .attr('x', 150)
        .attr('y', 300)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(fromAddress)
        .on('mouseover', (event) => showTooltip(event, `From Address: ${fromAddress}`))
        .on('mouseout', hideTooltip)
        .on('click', () => {
          copyToClipboard(fromAddress);
          showNodeDetails('Address', fromAddress);
        });

      // Draw to address
      const toCircle = this.g.append('circle')
        .attr('cx', 650)
        .attr('cy', 300)
        .attr('r', 50)
        .attr('fill', '#804040')
        .call(drag)
        .on('mouseover', (event) => showTooltip(event, `To Address: ${toAddress}`))
        .on('mouseout', hideTooltip)
        .on('click', () => {
          copyToClipboard(toAddress);
          showNodeDetails('Address', toAddress);
        });

      this.g.append('text')
        .attr('x', 650)
        .attr('y', 300)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(toAddress)
        .on('mouseover', (event) => showTooltip(event, `To Address: ${toAddress}`))
        .on('mouseout', hideTooltip)
        .on('click', () => {
          copyToClipboard(toAddress);
          showNodeDetails('Address', toAddress);
        });

      // Display token transfers
      if (tokenTransfers && tokenTransfers.length > 0) {
        tokenTransfers.forEach((transfer, index) => {
          const tokenSymbol = transfer.token_symbol;
          const decimals = this.tokenDecimals[tokenSymbol] || 18;
          const transferAmount = this.formatTokenAmount(transfer.token_amount, decimals);

          this.g.append('text')
            .attr('x', 400)
            .attr('y', 180 + index * 30)
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .text(`${transferAmount} ${tokenSymbol}`);
        });
      }

      // Draw arrows
      const link1 = this.g.append('line')
        .attr('x1', 200)
        .attr('y1', 300)
        .attr('x2', 350)
        .attr('y2', 100)
        .attr('stroke', 'black')
        .attr('marker-end', 'url(#arrow)');

      const link2 = this.g.append('line')
        .attr('x1', 450)
        .attr('y1', 100)
        .attr('x2', 600)
        .attr('y2', 300)
        .attr('stroke', 'black')
        .attr('marker-end', 'url(#arrow)');

      // Function to update the link positions
      const updateLinks = () => {
        link1
          .attr('x1', fromCircle.attr('cx'))
          .attr('y1', fromCircle.attr('cy'))
          .attr('x2', parseFloat(txRect.attr('x')) + parseFloat(txRect.attr('width')) / 2)
          .attr('y2', parseFloat(txRect.attr('y')) + parseFloat(txRect.attr('height')) / 2);

        link2
          .attr('x1', parseFloat(txRect.attr('x')) + parseFloat(txRect.attr('width')) / 2)
          .attr('y1', parseFloat(txRect.attr('y')) + parseFloat(txRect.attr('height')) / 2)
          .attr('x2', toCircle.attr('cx'))
          .attr('y2', toCircle.attr('cy'));
      };

      updateLinks();
    },
    async fetchTransactionHistory(address) {
      this.loading = true;
      try {
        const response = await axios.post('/etherscan/fetch_transaction_history.php', { address, page: this.currentPage });
        if (response.data.status === 'success') {
          this.transactionHistory = response.data.data;
        } else {
          this.transactionHistory = [];
          this.statusMessage = response.data.message;
        }
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        this.transactionHistory = [];
        this.statusMessage = 'An error occurred while fetching the transaction history.';
      } finally {
        this.loading = false;
      }
    },
    async addTransactionToVisualization(txHash) {
      this.txHash = txHash;
      await this.lookupTransaction();
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.fetchTransactionHistory(this.nodeDetails.id);
      }
    },
    nextPage() {
      this.currentPage++;
      this.fetchTransactionHistory(this.nodeDetails.id);
    },
    resetZoom() {
      this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity);
    },
    async applyFilters() {
      try {
        const response = await axios.post('/etherscan/filter_transactions.php', {
          startDate: this.startDate,
          endDate: this.endDate,
          minValue: this.minValue,
          specificAddress: this.specificAddress,
        });
        if (response.data.status === 'success') {
          this.transactionData = response.data.data;
          this.statusMessage = '';
          this.renderVisualization();
        } else {
          this.statusMessage = response.data.message;
          this.transactionData = null;
        }
      } catch (error) {
        console.error('Error applying filters:', error);
        this.statusMessage = 'An error occurred while applying the filters.';
        this.transactionData = null;
      }
    }
  }
};
</script>

<style>
.tool2-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

form, .filters, .legend {
  margin-bottom: 20px;
}

#visualization {
  width: 800px;
  height: 600px;
  border: 1px solid #ccc;
  position: relative; /* Added for tooltip positioning */
}

.tooltip {
  position: absolute;
  text-align: center;
  width: 120px;
  padding: 8px;
  font: 12px sans-serif;
  background: lightsteelblue;
  border: 0px;
  border-radius: 8px;
  pointer-events: none;
  z-index: 10;
}

.status-message, .copy-message {
  color: #e74c3c;
  margin-top: 10px;
}

.legend {
  border: 1px solid #ccc;
  padding: 10px;
  margin-top: 20px;
  background-color: #f9f9f9;
  text-align: left;
}

.legend h3 {
  margin: 0;
  margin-bottom: 10px;
}

.legend p {
  margin: 5px 0;
}

.legend .rect {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-color: #69b3a2;
  margin-right: 5px;
}

.legend .circle {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 5px;
}

.legend .from {
  background-color: #404080;
}

.legend .to {
  background-color: #804040;
}

.filters label {
  display: block;
  margin-bottom: 10px;
}

.filters input {
  margin-left: 5px;
}

.node-details {
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
  text-align: left;
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: 300px;
}

.node-details button {
  margin-top: 10px;
  cursor: pointer;
}

.transaction-history {
  margin-top: 20px;
}

.transaction-history table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}

.transaction-history th, .transaction-history td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

.transaction-history th {
  background-color: #f2f2f2;
}

.transaction-history button {
  cursor: pointer;
}

.outgoing {
  color: red;
}

.incoming {
  color: green;
}
</style>
