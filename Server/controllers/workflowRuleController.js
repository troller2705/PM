import WorkflowRule from '../models/WorkflowRule.js';

export const getWorkflowRules = async (req, res) => {
  try {
    const rules = await WorkflowRule.find({});
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkflowRuleById = async (req, res) => {
  try {
    const rule = await WorkflowRule.findById(req.params.id);
    if (rule) {
      res.status(200).json(rule);
    } else {
      res.status(404).json({ message: 'Workflow Rule not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWorkflowRule = async (req, res) => {
  try {
    const rule = await WorkflowRule.create(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateWorkflowRule = async (req, res) => {
  try {
    const rule = await WorkflowRule.findById(req.params.id);
    if (rule) {
      Object.assign(rule, req.body);
      const updatedRule = await rule.save();
      res.status(200).json(updatedRule);
    } else {
      res.status(404).json({ message: 'Workflow Rule not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteWorkflowRule = async (req, res) => {
  try {
    const rule = await WorkflowRule.findById(req.params.id);
    if (rule) {
      await rule.deleteOne();
      res.status(200).json({ message: 'Workflow Rule removed' });
    } else {
      res.status(404).json({ message: 'Workflow Rule not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};