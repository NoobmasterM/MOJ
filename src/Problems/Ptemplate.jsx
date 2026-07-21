import React, { useState, useEffect } from "react";
import Editor from "../Editor";
import { Row, Col, Container, Table, Badge, Accordion } from "react-bootstrap";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams } from "react-router-dom";
import Difficulty from "../Difficulty";

const ProblemData = {
  1: {
    title: 'Hello World',
    time_limit: 2,
    memory_limit: 256,
  
    statement: "Given a string \\(S\\) of length \\(n\\). Output the given string. ",
    input_Statement: "The first line contains an integer \\(n\\) (\\(1 \\le n \\le 2\\times10^5\\)) . \\\\ The second line contains a string \\(S\\) of length \\(n\\).",
    output_Statement: "Output the string \\(S\\). ",
    notes: "Given input \\(S\\) is Hello. Thus output is also Hello.",
    ratings: { rating: 2400, fill: 80, color: 'red' },
    tags: [
      { name: 'Basic', bg: 'success' },
      { name: 'Segment Tree', bg: 'danger' }
    ],
    sample_tests: [
      {
        input: "5\nHello",
        output: "Hello"
      }
    ]
  },
  2: {
    title: 'Array Max',
    time_limit: 2,
    memory_limit: 256,
   
    statement: "Given an array \\(A\\) of size \\(n\\). Output the largest element in it. ",
    input_Statement: "The first line contains an integer \\(n\\) (\\(1 \\le n \\le 2\\times10^5\\)) . \\\\ The second line contains \\(n\\) numbers.",
    output_Statement: "Output the maximum element in \\(A\\). ",
    notes: "Pretty self-explanatory",
    ratings: { rating: 3600, fill: 40, color: 'orange' },
    tags: [
      { name: 'Basic', bg: 'success' },
      { name: 'Arrays', bg: 'success' }
    ],
    sample_tests: [
      {
        input: "5\n1 2 3 4 5",
        output: "5"
      },
      {
        input: "5\n-1 -2 0 -3 8",
        output: "8"
      }
    ]
  }
};

function Ptemp() {
  const { ID } = useParams();
  const [problem, setProblem] = useState(null);

  useEffect(() => {
    const data = ProblemData[ID];
    setProblem(data);
  }, [ID]);

  if (!problem) {
    return <Container className="p-4">Loading problem details...</Container>;
  }

  return (
    <MathJaxContext>
      <Container className="p-4">
        <Row>
          <Col>
            {/* PANEL 1: PROBLEM HEADER METRICS CARD */}
            <div className="card text-center mb-4">
              <h3>{problem.title}</h3>
              <span>{`time limit per test: ${problem.time_limit} seconds`}</span> <br />
              <span>{`memory limit per test: ${problem.memory_limit} mb`}</span>
            </div>

            {/* PANEL 2: CORE STATEMENT SHEET */}
            <div className="card mb-4">
              <MathJax>{problem.statement}</MathJax>
              <br />
              <h4>Input</h4>
              <MathJax>{problem.input_Statement}</MathJax>
              <br />
              <h4>Output</h4>
              <MathJax>{problem.output_Statement}</MathJax>
            </div>
            
            {/* PANEL 3: SAMPLE TESTS EXAMPLES CARD */}
            <div className="card mb-4">
              <h5>Example</h5>
              {problem.sample_tests?.map((test, index) => (
                <div key={index} className="mb-4">
                  <h6 className="text-muted">Example #{index + 1}</h6>
                  <Row>
                    <Col md={6}>
                      <Table bordered square style={{ marginBottom: 0 }}>
                        <thead>
                          <tr className="table-light">
                            <th style={{ padding: '6px 12px', fontSize: '14px' }}>Input</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '10px' }}>
                              {test.input}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>

                    <Col md={6}>
                      <Table bordered square style={{ marginBottom: 0 }}>
                        <thead>
                          <tr className="table-light">
                            <th style={{ padding: '6px 12px', fontSize: '14px' }}>Output</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '10px' }}>
                              {test.output}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>

            {/* PANEL 4: TECHNICAL NOTES FOOTER */}
            <div className="card mb-4">
              <h5>Notes</h5>
              <MathJax>{problem.notes}</MathJax>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            {/* PANEL 5: ACTIVE CODE RUNNER EDITOR PANEL */}
            <div className="card mb-4">
              <Editor />
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            {/* PANEL 6: RATINGS, METRICS & META PANEL */}
            <div className="card mb-4">
              <h5 style={{ display: "inline" }}>Ratings:</h5>
              <Difficulty rating={problem.ratings.rating} fill={problem.ratings.fill} color={problem.ratings.color} />
              <br /><br />
              
              <h5 style={{ display: "inline" }}>Tags: </h5>
              {problem.tags?.map((tag, idx) => (
                <span key={idx} style={{ marginRight: '5px' }}>
                  <Badge pill bg={tag.bg}>{tag.name}</Badge>
                </span>
              ))}
              <br /><br />

              <Accordion flush alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Editorial</Accordion.Header>
                  <Accordion.Body>Bruh</Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Discussion</Accordion.Header>
                  <Accordion.Body>No discussion yet</Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
          </Col>
        </Row>
      </Container>
    </MathJaxContext>
  );
}

export default Ptemp;
