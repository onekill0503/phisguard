import { gql } from 'graphql-request'
const GET_LAST_TRANSACTION = gql`
  query getLastTransaction {
    transactions(orderDirection: "DESC", orderBy: "taskIndex", limit: 10) {
      items {
        data
        from
        id
        message
        status
        taskIndex
        to
        value
        blockTimestamp
      }
    }
  }
`

export default GET_LAST_TRANSACTION
