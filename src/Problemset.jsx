import React, { useState, useEffect } from "react";
import Header from './Header'
import { Table, Badge, Container } from "react-bootstrap";
import Difficulty from "./Difficulty";
import { Link } from "react-router-dom";
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

function ProblemSet(){
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                setLoading(true);
                const data = await apiClient.getProblems();
                setProblems(data);
            } catch (err) {
                setError(err.message);
                console.error('Failed to fetch problems:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProblems();
    }, []);

    if (loading) return <Container className="p-4">Loading problems...</Container>;
    if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;

    return (
       <Container>
        <Table hover responsive>
       <thead>
        <tr>
          <th>No.</th>
          <th>Rating</th>
          <th>Name</th>
          <th>Difficulty</th>
          <th>Tags</th>
          <th>Solved</th>
        </tr>
      </thead>
      <tbody>
        {problems.map((problem, idx) => {
          const tags = normalizeTags(problem.tags);
          return (
            <tr key={problem.id}>
              <td>{idx + 1}</td>
              <td>
                {problem.editorialRating ? (
                  <Difficulty 
                    rating={problem.editorialRating} 
                    fill={getRatingFill(problem)}
                    color={problem.editorialColor || "gray"}
                  />
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td><Link to={`/Problems/${problem.id}`}>{problem.title}</Link></td>
              <td>
                <Badge bg={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Hard' ? 'warning' : 'danger'}>
                  {problem.difficulty}
                </Badge>
              </td>
              <td>
                {tags.length > 0 ? (
                  tags.map((tag, tagIdx) => (
                    <Badge key={tagIdx} pill bg={tag==='DP' ? 'primary' : tag==='Graph' ? 'info' : tag==='Math' ? 'success' : tag==='Segment Tree' ? 'warning': tag==='Array'?'info':'danger'} className="me-1">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td>{problem._count?.submissions || 0}</td>
            </tr>
          );
        })}
      </tbody>
        </Table>
        </Container>
    )
}

export default ProblemSet;
