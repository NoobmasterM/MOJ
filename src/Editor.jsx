import React, { useState } from "react";
import Editor from '@monaco-editor/react';
import { Button, Form, Row, Col, Alert, Card, Spinner } from "react-bootstrap";
import { apiClient } from "./api/client";

const DEFAULT_CODE = {
  javascript: "console.log('Hello, World!');",
  python: "print('Hello, World!')",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n    cout << \"Hello, World!\" << endl;\n    return 0;\n}",
  c: "#include <stdio.h>\n\nint main(){\n    printf(\"Hello, World!\\n\");\n    return 0;\n}",
  java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}"
};

function IDE({ problemsetId }) {
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [executionTime, setExecutionTime] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage] || "");
    setOutput("");
    setError("");
    setSubmissionResult(null);
  };

  const handleRunCode = async () => {
    try {
      setLoading(true);
      setIsRunning(true);
      setOutput("");
      setError("");
      setExecutionTime(0);

      const result = await apiClient.executeCode(code, language, input);

      if (result.status === "error" || result.error) {
        setError(result.error || "Unknown error occurred");
      } else {
        setOutput(result.output || "No output");
      }
      setExecutionTime(result.executionTime || 0);
    } catch (err) {
      setError(err.message || "Failed to execute code");
      console.error("Execution error:", err);
    } finally {
      setLoading(false);
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    try {
      const storedUser = localStorage.getItem("mojUser");
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user?.id) {
        setError("Please login before submitting.");
        setSubmissionResult(null);
        return;
      }

      setLoading(true);
      setOutput("");
      setError("");
      setSubmissionResult(null);

      const result = await apiClient.testSubmit({
        userId: user.id,
        problemsetId,
        code,
        language
      });

      setSubmissionResult(result);
    } catch (err) {
      setError(err.message || "Failed to submit code");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label><strong>Language</strong></Form.Label>
            <Form.Select 
              value={language} 
              onChange={handleLanguageChange}
              disabled={loading}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="java">Java</option>
            </Form.Select>
          </Form.Group>
        </Col>
        
      </Row>

      <Row className="mb-3">
        <Col md={8}>
          <Card>
            <Card.Header><strong>Code Editor</strong></Card.Header>
            <Card.Body style={{ padding: 0 }}>
              <Editor
                height="400px"
                language={language}
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Header><strong>Input</strong></Card.Header>
            <Card.Body style={{ padding: 0 }}>
              <Form.Control
                as="textarea"
                rows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input here (optional)"
                style={{ height: "120px", fontSize: "12px" }}
              />
            </Card.Body>
          </Card>
          <Col md={9} className="d-flex align-items-end gap-2">
          <Button 
            onClick={handleRunCode} 
            disabled={loading}
            className="w-50"
            style={{backgroundColor:'purple'}}
            data-bs-theme="dark"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Running...
              </>
            ) : (
              "Run"
            )}
          </Button>
          {problemsetId && (
            <Button
              onClick={handleSubmitCode}
              disabled={loading}
              style={{backgroundColor:'purple'}}
              className="w-50"
            >
              Submit
            </Button>
          )}
        </Col>
        </Col>
      </Row>

      {output && (
        <Card className="mb-3 border-success">
          <Card.Header className="bg-success text-white">
            <strong> Output</strong>
            {executionTime > 0 && (
              <span className="float-end">
                Time: {executionTime}ms
              </span>
            )}
          </Card.Header>
          <Card.Body>
            <pre style={{ 
              background: "#f5f5f5", 
              padding: "10px", 
              borderRadius: "4px",
              maxHeight: "200px",
              overflowY: "auto",
              margin: 0
            }}>
              {output}
            </pre>
          </Card.Body>
        </Card>
      )}

      {error && (
        <Alert variant="danger">
          <Alert.Heading> Error</Alert.Heading>
          <pre style={{ margin: 0 }}>
            {error}
          </pre>
          {executionTime > 0 && (
            <small className="text-muted mt-2 d-block">
              Execution time: {executionTime}ms
            </small>
          )}
        </Alert>
      )}

      {submissionResult && (
        <Card className="mb-3">
          <Card.Header className={submissionResult.summary.status === "ACCEPTED" ? "bg-success text-white" : "bg-danger text-white"}>
            <strong>{submissionResult.summary.status}</strong>
            <span className="float-end">
              {submissionResult.summary.passed}/{submissionResult.summary.total} test cases passed
            </span>
          </Card.Header>
          <Card.Body>
            {submissionResult.testResults.map((test) => (
              <Alert key={test.testCaseIndex} variant={test.passed ? "success" : "danger"}>
                <strong>Test {test.testCaseIndex}: {test.passed ? "Passed" : "Failed"}</strong>
                {!test.passed && (
                  <div className="mt-2">
                    <div><strong>Expected:</strong></div>
                    <pre className="mb-2">{test.expectedOutput}</pre>
                    <div><strong>Actual:</strong></div>
                    <pre className="mb-0">{test.actualOutput || test.error || "No output"}</pre>
                  </div>
                )}
              </Alert>
            ))}
          </Card.Body>
        </Card>
      )}

      {!output && !error && isRunning && (
        <Alert variant="info">
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2"
          />
          Executing code...
        </Alert>
      )}
    </div>
  );
}

export default IDE;
