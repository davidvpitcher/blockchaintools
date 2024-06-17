function generateUniqueTable() {
    // Get the input value
    const walletAddresses = document.getElementById('walletAddresses').value.trim().split('\n');

    // Create a set to hold unique addresses, all in lowercase
    const uniqueAddresses = new Set();

    // Add each address to the set in lowercase
    walletAddresses.forEach((address) => {
        const lowerCaseAddress = address.trim().toLowerCase();
        console.log('Adding address:', lowerCaseAddress);  // Debug log
        uniqueAddresses.add(lowerCaseAddress);
    });

    // Get the table body element
    const tableBody = document.getElementById('resultTable').getElementsByTagName('tbody')[0];

    // Clear any existing rows in the table body
    tableBody.innerHTML = '';

    // Generate table rows for the unique addresses
    uniqueAddresses.forEach((address) => {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);

        cell.textContent = address;
    });
}
