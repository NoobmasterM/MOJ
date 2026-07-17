import React from "react";
import Header from './Header'
import { Table,Badge, Container} from "react-bootstrap";
import Difficulty from "./Difficulty";
import { Link } from "react-router-dom";

const Problems = [
  {id: 1, title: 'Hello World', rating: 2400, fill: 80, color: 'red', solved: 0,
   tags: [{name: 'Basic', bg: 'success'}, 
          {name: 'Segment Tree', bg: 'danger'}
   ]
  },
  {id: 2, title: 'Array Max', rating: 3600, fill: 40, color: 'orange', solved: 0,
   tags: [{name: 'Basic', bg: 'success'}, 
          {name: 'Arrays', bg: 'success'}
   ]
  }
  ];

function ProblemSet(){
    return (
       <Container>
        <Table>
       <thead>
        <tr>
          <th>No.</th>
          <th>Rating</th>
          <th>Name</th>
          <th>Tags</th>
          <th>Solved</th>
        </tr>
      </thead>
      <tbody>

        {Problems?.map((problem) => (<tr key = {problem.id}>
          <td>{problem.id}</td>
          <td><Difficulty rating = {problem.rating} fill = {problem.fill} 
               color = {problem.color}/></td>

          <td><Link to={`/Problems/${problem.id}`}> {problem.title} </Link></td>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '30px' }}>
          <td>{problem.tags?.map((tag) => (
            <span><Badge pill bg = {tag.bg}> {tag.name}
                  </Badge>
            </span>))}
            </td>
          </div>
          <td> {problem.solved} </td>
        </tr>))}
        
      </tbody>
        </Table>
        </Container>
    )
}

export default ProblemSet;