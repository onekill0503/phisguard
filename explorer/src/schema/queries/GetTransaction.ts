import { gql } from 'graphql-request'
const GET_TRANSACTION = gql`
  query getTransaction($taskId: BigInt!) {
    transactions(
      orderDirection: "DESC"
      orderBy: "taskIndex"
      limit: 10
      where: { taskIndex: $taskId }
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

export default GET_TRANSACTION
