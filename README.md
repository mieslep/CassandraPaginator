
# cassandra-paginator

Apache Cassandra® CQL lacks the `OFFSET` parameter that SQL and some other languages have. The `CassandraPaginator` is built to incorporate this abstraction, allowing you to paginate and "jump around" in the query results without needing to re-query the database. 

Cassandra Paginator is a utility library designed to facilitate efficient pagination of query results from Cassandra.

### Features

* Abstracts driver "fetch pages" from client "user pages."
* Access user pages out-of-order and repeatedly.
* Lazy fetching: data pulled from the database in `fetchSize` chunks, but only as needed to satisfy the page request.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Installing

```bash
npm install cassandra-paginator
```

## Usage

Here's a quick example to get you started:

```javascript
const { CassandraPaginator } = require('cassandra-paginator');
const { Client } = require('cassandra-driver');

// Initialize your Cassandra client
const client = new Client({ contactPoints: ['localhost'], localDataCenter: 'datacenter1' });

// Create a new paginator instance
const paginator = new CassandraPaginator(client, "SELECT * FROM your_table WHERE condition = ? LIMIT 19", ['value'], {}, {pageSize: 5});

// Get first page
await paginator.getPage(1).then(page => {
  console.log(`page number: ${paginator.getCurrentPageNumber()}`)
  console.log(page);
});
// Skip a page
await paginator.getPage(3).then(page => {
  console.log(`page number: ${paginator.getCurrentPageNumber()}`)
  console.log(page);
});
// Get the next page
await paginator.getNextPage().then(page => {
  console.log(`page number: ${paginator.getCurrentPageNumber()}`)
  console.log(page);
});
// Go back a page
await paginator.getPage(2).then(page => {
  console.log(`page number: ${paginator.getCurrentPageNumber()}`)
  console.log(page);
});
// Revisit a page
await paginator.getPage(4).then(page => {
  console.log(`page number: ${paginator.getCurrentPageNumber()}`)
  console.log(page);
});
// Go beyond the end of the data
await paginator.getNextPage().then(page => {
  console.log(`page number: ${paginator.getCurrentPageNumber()}`)
  console.log(page);
});
// Get a non-existent page
await paginator.getPage(5).then(page => {
  console.log(`page number: ${paginator.getCurrentPageNumber()}`)
  console.log(page);
});

```

## API Documentation

For detailed API documentation, see [CassandraPaginator](classes\CassandraPaginator.CassandraPaginator.md).

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.
