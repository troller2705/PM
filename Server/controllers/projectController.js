import Project from '../models/Project.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({});
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      res.status(200).json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  const { name, code, description, status, priority, project_type, lead_id, department_id, team_member_ids, start_date, target_date } = req.body;

  try {
    const project = await Project.create({
      name,
      code,
      description,
      status,
      priority,
      project_type,
      lead_id,
      department_id,
      team_member_ids,
      start_date,
      target_date,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res) => {
  const { name, code, description, status, priority, project_type, lead_id, department_id, team_member_ids, start_date, target_date } = req.body;

  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      project.name = name || project.name;
      project.code = code || project.code;
      project.description = description || project.description;
      project.status = status || project.status;
      project.priority = priority || project.priority;
      project.project_type = project_type || project.project_type;
      project.lead_id = lead_id || project.lead_id;
      project.department_id = department_id || project.department_id;
      project.team_member_ids = team_member_ids || project.team_member_ids;
      project.start_date = start_date || project.start_date;
      project.target_date = target_date || project.target_date;

      const updatedProject = await project.save();
      res.status(200).json(updatedProject);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      await project.deleteOne(); // Use deleteOne() for Mongoose 6+
      res.status(200).json({ message: 'Project removed' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};