import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export enum PlanQuery {
  direct = "direct",
  reroute = "reroute",
  alt = "alt",
  tempAlt = "tempAlt",
  hold = "hold",
  cancelHold = "cancelHold"
}

export type Plan = {
  cid: string;
  callsign: string;
  planData: Record<string, any>;
  queryType: PlanQuery;
  msg?: string;
  dest?: string;
};

export type PlanState = {
  planQueue: Plan[];
  selectedPlanIndex: number | null;
};

const initialState = {
  planQueue: [],
  selectedPlanIndex: null
};

const planSlice = createSlice({
  name: "plan",
  initialState: initialState as PlanState,
  reducers: {
    addTrialPlan(state, action: { payload: Plan }) {
      state.planQueue.unshift(action.payload);
      state.selectedPlanIndex = 0;
    },
    removeTrialPlan(state, action: { payload: number }) {
      if (action.payload < state.planQueue.length) {
        state.selectedPlanIndex = null;
        state.planQueue.splice(action.payload, 1);
      }
    },
    planCleanup(state) {
      state.planQueue = [];
      state.selectedPlanIndex = null;
    },
    setSelectedTrialPlanIndex(state, action: { payload: number | null }) {
      state.selectedPlanIndex = action.payload;
    }
  }
});

export const { addTrialPlan, removeTrialPlan, setSelectedTrialPlanIndex, planCleanup } = planSlice.actions;
export default planSlice.reducer;

export const selectedPlanIndexSelector = (state: RootState) => state.plan.selectedPlanIndex;
export const planQueueSelector = (state: RootState) => state.plan.planQueue;
