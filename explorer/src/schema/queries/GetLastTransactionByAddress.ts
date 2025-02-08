import { gql } from 'graphql-request'
const GET_LAST_TRANSACTION_BY_ADDRESS = gql`
  query getTransaction($address: String!) {
    transactions(
      orderDirection: "DESC"
      orderBy: "taskIndex"
      limit: 10
      where: { from: $address }
    ) {
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

export default GET_LAST_TRANSACTION_BY_ADDRESS
