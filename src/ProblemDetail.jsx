import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Container, Badge, Accordion } from "react-bootstrap";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import Header from "./Header";
import Editor from "./Editor";
import Difficulty from "./Difficulty";
import { apiClient } from "./api/client";

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags !== "string") return [];

  try {
    const parsedTags = JSON.parse(tags);
    if (Array.isArray(parsedTags)) return parsedTags;
  } catch {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
};

const getRatingFill = (problem) => {
  if (problem.editorialFill) return problem.editorialFill;
  if (!problem.editorialRating) return 0;
  return Math.min(100, Math.max(20, Math.round(problem.editorialRating / 30)));
};

function ProblemDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getProblem(id);
        setProblem(data);

        try {
          const currentUser = await apiClient.getCurrentUser();
          if (currentUser?.id) {
            const submissions = await apiClient.getSubmissionsByProblem(data.id);
            setUserSubmissions(submissions || []);
          } else {
            setUserSubmissions([]);
          }
        } catch {
          setUserSubmissions([]);
        }
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch problem:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-danger">Error: {error}</div>;
  if (!problem) return <div className="p-4">Problem not found</div>;
  const examples = Array.isArray(problem.examples) ? problem.examples : [];
  const tags = normalizeTags(problem.tags);

  return (
    <Container className="p-4">
      <Row>
        <Col>
          <div className="text-center">
            <h3>{problem.title}</h3>
            <span>time limit per test: {problem.timeLimit} seconds</span> <br />
            <span>memory limit per test: {problem.memoryLimit} MB</span>
            <hr />
          </div>

          <MathJaxContext>
            <MathJax>
              {String.raw`
              ${problem.description}
              `}
            </MathJax>
            <br />

            <h4>Input</h4>
            <MathJax>
              {String.raw`
              ${problem.input}
              `}
            </MathJax>
            <br />

            <h4>Output</h4>
            <MathJax>
              {String.raw`
              ${problem.output}
              `}
            </MathJax>
            <br />
          </MathJaxContext>

          <h5>Examples</h5>
          {examples.length > 0 ? (
            examples.map((example, idx) => (
              <div key={idx}>
                <h6>Example {idx + 1}</h6>
                <div className="bg-light p-2 mb-2">
                  <strong>Input:</strong>
                  <pre>{example.input}</pre>
                </div>
                <div className="bg-light p-2 mb-3">
                  <strong>Output:</strong>
                  <pre>{example.output}</pre>
                </div>
                {example.explanation && (
                  <div className="mb-3">
                    <strong>Explanation:</strong>
                    <p className="mb-0">{example.explanation}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No examples available</p>
          )}
        </Col>
        <MathJaxContext>
               {problem.notes && (
              <>
                <h5>Notes</h5>
                <MathJax>
                  {String.raw`
                  ${problem.notes}
                  `}
                </MathJax>
                <br />
              </>
            )}
            </MathJaxContext>
      </Row>

      <Row>
        <Col>
          <Editor problemsetId={problem.id} />
          <br />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <h5>Submissions</h5>
          {userSubmissions.length > 0 ? (
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Passed</th>
                  <th>Language</th>
                  <th>Execution Time</th>
                  <th>Memory</th>
                </tr>
              </thead>
              <tbody>
                {userSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>{new Date(submission.createdAt).toLocaleString()}</td>
                    <td>
                      <Badge bg={submission.status === 'ACCEPTED' ? 'success' : submission.status === 'FAILED' ? 'danger' : 'secondary'}>
                        {submission.status}
                      </Badge>
                    </td>
                    <td>{submission.testsPassed ?? 0}/{submission.totalTests ?? 0}</td>
                    <td>{submission.language}</td>
                    <td>{submission.executionTime != null ? `${submission.executionTime} ms` : '—'}</td>
                    <td>{submission.memoryUsed != null ? `${submission.memoryUsed} MB` : `${problem.memoryLimit ?? 0} MB`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No submissions yet for this problem.</p>
          )}
        </Col>
      </Row>

      <Row>
        <Col>
          <h5 style={{ display: "inline" }}>Ratings:</h5>
          {problem.editorialRating ? (
            <>
                  <Difficulty
                    rating={problem.editorialRating}
                  fill={getRatingFill(problem)}
                  color={problem.editorialColor || "gray"}
                />
            </>
          ) : (
            <span className="text-muted">No rating</span>
          )}
          <br />
          <br />

          {tags.length > 0 && (
            <>
              <h5 style={{ display: "inline" }}>Tags: </h5>
              {tags.map((tag, idx) => (
                <Badge key={idx} pill bg={tag==='DP' ? 'primary' : tag==='Graph' ? 'info' : tag==='Math' ? 'success' : tag==='Segment Tree' ? 'warning': tag==='Array'?'info':'danger'} className="me-1">
                    {tag}
              </Badge>
              ))}
              <br />
              <br />
            </>
          )}

          <Accordion flush>
            {problem.editorial && (
              <Accordion.Item eventKey="0">
                <Accordion.Header>Editorial</Accordion.Header>
                <Accordion.Body>{problem.editorial}</Accordion.Body>
              </Accordion.Item>
            )}
            {problem.discussion && (
              <Accordion.Item eventKey="1">
                <Accordion.Header>Discussion</Accordion.Header>
                <Accordion.Body>{problem.discussion}</Accordion.Body>
              </Accordion.Item>
            )}
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
}

export default ProblemDetail;
