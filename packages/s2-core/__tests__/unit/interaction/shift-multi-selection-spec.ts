import { createFakeSpreadSheet } from 'tests/util/helpers';
import { Event as GEvent } from '@antv/g-canvas';
import { omit } from 'lodash';
import { CellMeta, S2Options, ViewMeta } from '@/common/interface';
import { SpreadSheet } from '@/sheet-type';
import {
  InteractionKeyboardKey,
  InteractionStateName,
  InterceptType,
  S2Event,
} from '@/common/constant';
import { ShiftMultiSelection } from '@/interaction/shift-multi-selection';

jest.mock('@/interaction/event-controller');

describe('Interaction Shift Multi Selection Tests', () => {
  let shiftMultiSelection: ShiftMultiSelection;
  let s2: SpreadSheet;

  const createMockCell = (
    cellId: string,
    { colIndex = 0, rowIndex = 0 } = {},
  ) => {
    const mockCellViewMeta: Partial<ViewMeta> = {
      id: cellId,
      colIndex,
      rowIndex,
      type: undefined,
    };
    const mockCellMeta = omit(mockCellViewMeta, 'update');
    const mockCell = {
      ...mockCellViewMeta,
      getMeta: () => mockCellViewMeta,
      hideInteractionShape: jest.fn(),
    };

    return {
      mockCell,
      mockCellMeta,
    };
  };

  beforeEach(() => {
    const mockCell = createMockCell('testId1').mockCell as any;
    s2 = createFakeSpreadSheet();
    s2.getCell = () => mockCell;
    shiftMultiSelection = new ShiftMultiSelection(s2);
    s2.options = {
      ...s2.options,
      tooltip: {
        operation: {
          trend: false,
        },
      },
    } as S2Options;
    s2.isTableMode = jest.fn(() => true);
    s2.interaction.intercepts.clear();
    s2.interaction.isEqualStateName = () => false;
    s2.interaction.getInteractedCells = () => [mockCell];
  });

  test('should bind events', () => {
    expect(shiftMultiSelection.bindEvents).toBeDefined();
  });

  test('should add click intercept when shift keydown', () => {
    s2.emit(S2Event.GLOBAL_KEYBOARD_DOWN, {
      key: InteractionKeyboardKey.SHIFT,
    } as KeyboardEvent);

    expect(s2.interaction.hasIntercepts([InterceptType.CLICK])).toBeTruthy();
  });

  test('should remove click intercept when shift keyup', () => {
    s2.emit(S2Event.GLOBAL_KEYBOARD_UP, {
      key: InteractionKeyboardKey.SHIFT,
    } as KeyboardEvent);

    expect(s2.interaction.hasIntercepts([InterceptType.CLICK])).toBeFalsy();
  });

  test('should set lastClickCell', () => {
    s2.interaction.changeState({
      cells: [],
      stateName: InteractionStateName.SELECTED,
    });
    const mockCell00 = createMockCell('0-0', { rowIndex: 0, colIndex: 0 });

    s2.getCell = () => mockCell00.mockCell as any;

    s2.emit(S2Event.DATA_CELL_CLICK, {
      stopPropagation() {},
    } as unknown as GEvent);

    expect(s2.store.get('lastClickCell')).toEqual(mockCell00.mockCell);
  });
  test('should select range data', () => {
    s2.interaction.changeState({
      cells: [],
      stateName: InteractionStateName.SELECTED,
    });

    s2.facet = {
      layoutResult: {
        colLeafNodes: [{ id: '0' }, { id: '1' }],
        rowLeafNodes: [{ id: '0' }, { id: '1' }],
      },
      getSeriesNumberWidth: () => 200,
    } as any;

    const mockCell00 = createMockCell('0-0', { rowIndex: 0, colIndex: 0 });
    const mockCell01 = createMockCell('0-1', { rowIndex: 0, colIndex: 1 });
    const mockCell10 = createMockCell('1-0', { rowIndex: 1, colIndex: 0 });
    const mockCell11 = createMockCell('1-1', { rowIndex: 1, colIndex: 1 });
    s2.store.set('lastClickCell', mockCell00.mockCell as any);
    s2.emit(S2Event.GLOBAL_KEYBOARD_DOWN, {
      key: InteractionKeyboardKey.SHIFT,
    } as KeyboardEvent);

    s2.getCell = () => mockCell11.mockCell as any;

    s2.emit(S2Event.DATA_CELL_CLICK, {
      stopPropagation() {},
    } as unknown as GEvent);

    s2.emit(S2Event.GLOBAL_KEYBOARD_UP, {
      key: InteractionKeyboardKey.SHIFT,
    } as KeyboardEvent);

    expect(s2.interaction.getState()).toEqual({
      cells: [
        mockCell00.mockCellMeta,
        mockCell10.mockCellMeta,
        mockCell01.mockCellMeta,
        mockCell11.mockCellMeta,
      ],
      stateName: InteractionStateName.SELECTED,
    });
    expect(
      s2.interaction.hasIntercepts([InterceptType.CLICK, InterceptType.HOVER]),
    ).toBeTruthy();
    expect(s2.hideTooltip).toHaveBeenCalled();
  });
});