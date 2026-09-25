import React, { useState, useEffect } from "react";
import Header from './Header'
import { Table, Badge, Container } from "react-bootstrap";
import Difficulty from "./Difficulty";
import { Link } from "react-router-dom";
import { apiClient } from "./api/client";
import { getDifficultyBadgeStyle, getRatingFill } from './colorUtils';

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

const ratingFill = (problem) => getRatingFill(problem.editorialRating, problem.editorialFill);

function ProblemSet(){
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [solvedProblemIds, setSolvedProblemIds] = useState(new Set());

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                setLoading(true);
                const data = await apiClient.getProblems();
                setProblems(data);

                try {
                    const user = await apiClient.getCurrentUser();
                    const submissions = await apiClient.getSubmissionsByUser(user.id).catch(() => []);
                    const solved = new Set(
                        submissions
                          .filter((submission) => submission.status === 'ACCEPTED')
                          .map((submission) => Number(submission.problemsetId ?? submission.problemset?.id))
                          .filter((id) => Number.isFinite(id))
                    );
                    setSolvedProblemIds(solved);
                } catch {
                    setSolvedProblemIds(new Set());
                }
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
          const isSolved = solvedProblemIds.has(Number(problem.id));
          return (
            <tr key={problem.id} className={isSolved ? 'table-success' : ''}>
              <td>{idx + 1}</td>
              <td>
                {problem.editorialRating ? (
                  <Difficulty 
                    rating={problem.editorialRating} 
                    fill={ratingFill(problem)}
                    color={problem.editorialColor || "gray"}
                  />
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td><Link to={`/Problems/${problem.id}`}>{problem.title}</Link></td>
              <td>
                <Badge style={getDifficultyBadgeStyle(problem.difficulty)}>{problem.difficulty}</Badge>
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
              <td>{problem.solvedCount ?? 0}</td>
            </tr>
          );
        })}
      </tbody>
        </Table>
        </Container>
    )
}

export default ProblemSet;
