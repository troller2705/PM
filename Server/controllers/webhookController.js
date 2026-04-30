import User from '../models/User.js';
import Task from '../models/Task.js';
import ResourceProfile from '../models/ResourceProfile.js';
import TimeLog from '../models/TimeLog.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Handle incoming Git webhooks
// @route   POST /api/webhooks/git
export const handleGitWebhook = async (req, res) => {
  // In a real application, you would verify a signature header here (e.g., X-Hub-Signature-256)
  // to ensure the payload actually came from GitHub/GitLab.

  const payload = req.body;

  // We are aiming to support push events
  // GitHub sends an array of 'commits' in the push payload
  if (!payload.commits || !Array.isArray(payload.commits)) {
    return res.status(200).json({ message: 'Payload received, but no commits found.' });
  }

  console.log(`Processing ${payload.commits.length} commits from webhook...`);

  let logsCreated = 0;

  for (const commit of payload.commits) {
    const commitMessage = commit.message;
    const commitHash = commit.id; // GitHub uses 'id' for the hash
    const gitUserEmail = commit.author?.email;

    if (!commitMessage || !gitUserEmail) continue;

    // 1. Extract Task ID and Time
    // Pattern matches: "#task-id" or "#t1"
    const taskIdMatch = commitMessage.match(/#([a-zA-Z0-9-]+)/);
    // Pattern matches: "time:2h" or "time:1.5h"
    const timeMatch = commitMessage.match(/time:([0-9.]+)h/i);

    if (!taskIdMatch) {
      console.log(`Commit ${commitHash} skipped: No task ID found.`);
      continue;
    }

    const taskId = taskIdMatch[1];
    const hoursSpent = timeMatch ? parseFloat(timeMatch[1]) : 0;

    // 2. Find the User
    // First, try matching the exact email
    let user = await User.findOne({ email: gitUserEmail });

    // If not found, try checking the git_aliases array
    if (!user) {
      user = await User.findOne({ git_aliases: gitUserEmail });
    }

    if (!user) {
      console.warn(`Commit ${commitHash} skipped: No internal user matched Git email ${gitUserEmail}.`);
      continue;
    }

    // 3. Find the Task
    // We assume the user is using the internal MongoDB ObjectId as the task ID in their commit,
    // or you might have a custom 'short_id' field in production. For this mock, we search by _id.
    let task;
    try {
      task = await Task.findById(taskId);
    } catch (err) {
      // If the taskId isn't a valid ObjectId, findById throws an error
      console.warn(`Commit ${commitHash} skipped: Task ID ${taskId} is invalid or not found.`);
      continue;
    }

    if (!task) {
      console.warn(`Commit ${commitHash} skipped: Task ${taskId} not found in database.`);
      continue;
    }

    // 4. Update Task with Commit Data
    task.git_commits.push({
      hash: commitHash,
      message: commitMessage,
      date: commit.timestamp || new Date(),
      author: commit.author?.name || gitUserEmail
    });
    
    // Add logged hours to the task aggregate
    if (hoursSpent > 0) {
      task.logged_hours += hoursSpent;
    }
    
    await task.save();

    // 5. Create the Financial Ledger Entry (TimeLog)
    if (hoursSpent > 0) {
      // Find the user's resource profile to get their live rate
      const profile = await ResourceProfile.findOne({ user_id: user._id });
      const rate = profile?.cost_per_hour || 0;

      const newLog = await TimeLog.create({
        task_id: task._id,
        project_id: task.project_id,
        user_id: user._id,
        hours: hoursSpent,
        date: commit.timestamp || new Date(),
        description: `Git Commit [${commitHash.substring(0, 7)}]: ${commitMessage.split('\n')[0]}`,
        billable: true,
        applied_hourly_rate: rate, // SNAPSHOT THE RATE!
      });
      
      logsCreated++;

      // 6. Optional: Create an Audit Log
      await AuditLog.create({
        action: 'webhook_received',
        entity_type: 'TimeLog',
        entity_id: newLog._id,
        user_id: user._id, // The user who pushed the code
        details: {
          commit_hash: commitHash,
          hours: hoursSpent,
          task_id: task._id.toString()
        }
      });
    }
  }

  res.status(200).json({ 
    message: 'Webhook processed successfully', 
    commits_processed: payload.commits.length,
    time_logs_created: logsCreated
  });
};