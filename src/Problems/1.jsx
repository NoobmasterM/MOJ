import React from "react";
import Editor from "../Editor";
import { Row,Col, Container, ListGroup, Table, Badge, Button, Accordion} from "react-bootstrap";
import Header from "../Header";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import Difficulty from "../Difficulty";

function P1(){
   return(
        <Container className="p-4">
            <Row>
                <Col>
            <div className="text-center">
             <h3>Hello World</h3>
             <span>time limit per test: 2 seconds</span> <br></br>
             <span>memory limit per test: 256 mb</span>
             <hr></hr>
             </div>
                <MathJaxContext>
                <MathJax>
                 {String.raw`
                 Given a string \(S\) of length \(n\). Output the given string.
                 `}
                </MathJax>
                <br></br>
                <h4>Input</h4>
                <MathJax>
                 {String.raw`
                 The first line contains an integer \(n\) (\(1 \le n \le 2\times10^5\)) . \( \\ \)The second line contains a string \(S\) of length \(n\).
                 `}
                </MathJax>
                <br></br>
                <h4>Ouput</h4>
                   <MathJax>
                 {String.raw`
                   Ouput the string \(S\). 
                 `}
                </MathJax>
              </MathJaxContext> 
              <br></br>
              <h5>Example</h5> 
              <Table striped bordered hover>
               <thead><tr><th>Input</th></tr></thead>
              <tbody>
                <tr><td>5<br></br> Hello</td></tr>
               </tbody>
            </Table>
            <Table striped bordered hover>
            <thead><tr><th>Output</th></tr></thead>
             <tbody>
            <tr><td>Hello</td></tr>
            </tbody>
           </Table>
           <h5>Notes</h5>
           <MathJaxContext>
            <MathJax>
             {String.raw`
              Given input \(S\) is Hello. Thus output is also Hello.
             `}
            </MathJax>
           </MathJaxContext>
           <br></br><br></br>
           </Col>
          </Row>
          <Row><Col><Editor/><br></br></Col></Row>
          <Row>
            <Col>
           <h5 style={{display:"inline"}}>Ratings:</h5><Difficulty rating={2400} fill={80} color="red"/><br></br><br></br>
           <h5 style={{display:"inline"}}>Tags: </h5><Badge pill bg="success">Basic</Badge><span> </span><Badge pill bg="danger">Segment Tree</Badge> <br></br><br></br>
            <Accordion flush>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Editorial</Accordion.Header>
                    <Accordion.Body>Bruh</Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                    <Accordion.Header>Discussion</Accordion.Header>
                    <Accordion.Body>No discussion yet</Accordion.Body>
                </Accordion.Item>  
            </Accordion>
            </Col>
          </Row>
          </Container>
   )
}

export default P1;