import ApprovalRequest from '../models/ApprovalRequest.js';

export const getApprovalRequests = async (req, res) => {
  try {
    const filter = req.query.task_id ? { task_id: req.query.task_id } : {};
    const requests = await ApprovalRequest.find(filter);
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getApprovalRequestById = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id);
    if (request) {
      res.status(200).json(request);
    } else {
      res.status(404).json({ message: 'Approval Request not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createApprovalRequest = async (req, res) => {
  try {
    const request = await ApprovalRequest.create(req.body);
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateApprovalRequest = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id);
    if (request) {
      Object.assign(request, req.body);
      const updatedRequest = await request.save();
      res.status(200).json(updatedRequest);
    } else {
      res.status(404).json({ message: 'Approval Request not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteApprovalRequest = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id);
    if (request) {
      await request.deleteOne();
      res.status(200).json({ message: 'Approval Request removed' });
    } else {
      res.status(404).json({ message: 'Approval Request not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};