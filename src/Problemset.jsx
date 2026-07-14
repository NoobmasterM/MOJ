import React from "react";
import Header from './Header'
import { Table,Badge, Container} from "react-bootstrap";
import Difficulty from "./Difficulty";
import { Link } from "react-router-dom";

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
        <tr>
          <td>1</td>
          <td><Difficulty rating={2400} fill={80} color="red"/></td>
          <td><Link to='/Problems/1'>Hello World</Link></td>
          <td><Badge pill bg="success">Basic</Badge><span> </span><Badge pill bg="danger">Segment Tree</Badge></td>
          <td>0</td>
        </tr>
      </tbody>
        </Table>
        </Container>
    )
}

export default ProblemSet;