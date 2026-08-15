import React, { useEffect, useState } from "react";
import { Badge, Container, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { apiClient } from "./api/client";

const getContestStatus = (contest) => {
  const now = Date.now();
  const startTime = new Date(contest.startTime).getTime();
  const endTime = new Date(contest.endTime).getTime();

  if (now < startTime) return "UPCOMING";
  if (now <= endTime) return "ONGOING";
  return "FINISHED";
};

const formatTimeLeft = (contest) => {
  const status = getContestStatus(contest);
  const targetTime = new Date(status === "UPCOMING" ? contest.startTime : contest.endTime).getTime();
  const diff = Math.max(0, targetTime - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (status === "FINISHED") return "Ended";
  return `${days > 0 ? `${days}d ` : ""}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        setContests(await apiClient.getContests());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <Container className="p-4">Loading contests...</Container>;
  if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;

  return (
    <Container className="p-4">
      <h2 className="mb-4">Contests</h2>
      <Table hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Contest</th>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
            <th>Timer</th>
            <th>Problems</th>
          </tr>
        </thead>
        <tbody>
          {contests.map((contest, index) => {
            const status = getContestStatus(contest);
            const problems = Array.isArray(contest.problemsets) ? contest.problemsets : [];

            return (
              <tr key={contest.id} className="contest-row">
                <td>{index + 1}</td>
                <td>
                  <Link to={`/contests/${contest.id}`} className="contest-link">
                    <div className="fw-bold">{contest.title}</div>
                    <small className="text-muted">{contest.description || "No description available."}</small>
                  </Link>
                </td>
                <td>
                  <Badge bg={status === "ONGOING" ? "success" : status === "UPCOMING" ? "info" : "secondary"}>
                    {status}
                  </Badge>
                </td>
                <td>{new Date(contest.startTime).toLocaleString()}</td>
                <td>{new Date(contest.endTime).toLocaleString()}</td>
                <td>{formatTimeLeft(contest)}</td>
                <td>{problems.length}</td>
              </tr>
            );
          })}
          {contests.length === 0 && (
            <tr>
              <td colSpan="7">No contests available.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default Contests;
