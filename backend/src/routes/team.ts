import { Router, Request, Response } from "express";
import TeamMember from "../models/TeamMember";

const router = Router();

/**
 * @openapi
 * /api/team:
 *   get:
 *     summary: Returns team member details (excludes related_insights).
 *     description: Retrieves details for a specific team member, excluding related insights.
 *     tags:
 *       - Team
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         description: The full name of the team member.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team member details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 role:
 *                   type: string
 *                   example: "Chief Technology Officer"
 *                 bio:
 *                   type: string
 *                   example: "John has over 15 years of experience..."
 *                 personal_quote:
 *                   type: string
 *                   example: "Innovation distinguishes between a leader and a follower."
 *       400:
 *         description: Query parameter "name" is missing.
 *       404:
 *         description: Team member not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/", async (req: Request, res: Response) => {
  const nameQuery = req.query.name as string;
  if (!nameQuery) {
    return res
      .status(400)
      .json({ error: "Query parameter 'name' is required" });
  }

  try {
    // Use a case-insensitive regular expression to match the full name.
    const member = await TeamMember.findOne({
      name: { $regex: new RegExp(`^${nameQuery}$`, "i") },
    }).lean();

    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }

    // Destructure the member details without related_insights.
    const { name, role, bio, personal_quote } = member;
    res.json({ name, role, bio, personal_quote });
  } catch (error) {
    console.error("Error retrieving team member:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/team/insights:
 *   get:
 *     summary: Returns only the related insights for a team member.
 *     description: Retrieves the insights associated with a team member.
 *     tags:
 *       - Team
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         description: The full name of the team member.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of related insights.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Innovative Solutions in 2023"
 *                   date:
 *                     type: string
 *                     example: "01/15/2023"
 *                   link:
 *                     type: string
 *                     example: "https://example.com/insight"
 *       400:
 *         description: Query parameter "name" is missing.
 *       404:
 *         description: Team member not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/insights", async (req: Request, res: Response) => {
  const nameQuery = req.query.name as string;
  if (!nameQuery) {
    return res
      .status(400)
      .json({ error: "Query parameter 'name' is required" });
  }

  try {
    // Use a case-insensitive regular expression to match the full name.
    const member = await TeamMember.findOne({
      name: { $regex: new RegExp(`^${nameQuery}$`, "i") },
    }).lean();

    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.json(member.related_insights);
  } catch (error) {
    console.error("Error retrieving team member insights:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
