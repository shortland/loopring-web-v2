import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../index";
import { Confirmation } from "./interface";
import { confirm, confirmDefiInvest, confirmDualInvest, showDualBeginnerHelp, hidDualBeginnerHelp } from "./reducer";

export const useConfirmation = (): {
  confirmation: Confirmation;
  confirmWrapper: () => void;
  confirmDefiInvest: () => void;
  confirmDualInvest: () => void;
} => {
  const confirmation: Confirmation = useSelector(
    (state: RootState) => state.localStore.confirmation
  );
  const dispatch = useDispatch();

  return {
    confirmation,
    confirmWrapper: React.useCallback(() => {
      dispatch(confirm(undefined));
    }, [dispatch]),
    confirmDualInvest: React.useCallback(() => {
      dispatch(confirmDualInvest(undefined));
      dispatch(showDualBeginnerHelp(undefined));
      setTimeout(() => {
        dispatch(hidDualBeginnerHelp(undefined))
      }, 5 * 1000);
    }, [dispatch]),
    confirmDefiInvest: React.useCallback(() => {
      dispatch(confirmDefiInvest(undefined));
    }, [dispatch]),
  };
};
