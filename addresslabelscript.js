function generateTable() {
    // Get the input values
    const walletAddresses = document.getElementById('walletAddresses').value.trim().toLowerCase().split('\n');
    const labels = document.getElementById('labels').value.trim().split('\n');
    const newAddresses = document.getElementById('newAddresses').value.trim().toLowerCase().split('\n');

    // Create a map of wallet addresses to labels, all in lowercase
    const addressLabelMap = {};
    walletAddresses.forEach((address, index) => {
        addressLabelMap[address.trim().toLowerCase()] = labels[index] ? labels[index].trim() : 'Default Label';
    });

    // Get the table body element
    const tableBody = document.getElementById('resultTable').getElementsByTagName('tbody')[0];

    // Clear any existing rows in the table body
    tableBody.innerHTML = '';

    // Generate table rows for the new addresses
    newAddresses.forEach((address) => {
        const trimmedAddress = address.trim().toLowerCase();
        const label = addressLabelMap[trimmedAddress] || 'Default Label';

        const row = tableBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);

        cell1.textContent = trimmedAddress;
        cell2.textContent = label;
    });
}
