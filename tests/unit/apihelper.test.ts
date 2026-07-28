import { Response } from "express";
import { sendSuccess, sendError } from "../../src/utils/apihelper.util";

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("apihelper.util", () => {
  it("sendSuccess responds with 200 and success:true by default", () => {
    const res = mockResponse();
    sendSuccess(res, { id: 1 }, "Done");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Done", data: { id: 1 } });
  });

  it("sendSuccess honors a custom status code", () => {
    const res = mockResponse();
    sendSuccess(res, { id: 2 }, "Created", 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("sendError includes the errors map only when provided", () => {
    const res = mockResponse();
    sendError(res, "Bad input", 400, { name: "Required" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Bad input", errors: { name: "Required" } });

    const res2 = mockResponse();
    sendError(res2);
    expect(res2.status).toHaveBeenCalledWith(500);
    expect(res2.json).toHaveBeenCalledWith({ success: false, message: "Error" });
  });

  it("sendSuccess omits the data field when none is given", () => {
    const res = mockResponse();
    sendSuccess(res, undefined, "No content");
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "No content", data: undefined });
  });

  it("sendError honors a custom status code without an errors map", () => {
    const res = mockResponse();
    sendError(res, "Not found", 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Not found" });
  });
});
