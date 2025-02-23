import * as React from 'react';
import {
  Checkbox,
  FormSelect,
  FormSelectOption,
  TextInput,
  TextInputTypes,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  ToolbarContent,
  ToolbarFilter,
  Select,
  SelectList,
  SelectOption,
  MenuToggleElement,
  MenuToggle,
  TextInputGroup,
  TextInputGroupMain
} from '@patternfly/react-core';
import {
  ActiveFilter,
  ActiveFiltersInfo,
  DEFAULT_LABEL_OPERATION,
  FILTER_ACTION_UPDATE,
  FilterType,
  AllFilterTypes,
  LabelOperation,
  ToggleType,
  ActiveTogglesInfo
} from '../../types/Filters';
import * as FilterHelper from '../FilterList/FilterHelper';
import { PromisesRegistry } from '../../utils/CancelablePromises';
import { kialiStyle } from 'styles/StyleUtils';
import { LabelFilters } from './LabelFilter';
import { arrayEquals } from 'utils/Common';
import { labelFilter } from './CommonFilters';
import { history, HistoryManager } from 'app/History';
import { serverConfig } from 'config';
import { PFColors } from '../Pf/PfColors';

const toolbarStyle = kialiStyle({
  padding: 0,
  rowGap: 'var(--pf-v5-global--spacer--md)',
  $nest: {
    '& > .pf-v5-c-toolbar__content': {
      paddingLeft: 0
    }
  }
});

const bottomPadding = kialiStyle({
  paddingBottom: 'var(--pf-v5-global--spacer--md)'
});

const formSelectStyle = kialiStyle({
  borderColor: PFColors.BorderColorLight100,
  backgroundColor: PFColors.BackgroundColor200,
  minWidth: '150px',
  maxWidth: '150px'
});

const filterSelectStyle = kialiStyle({
  maxHeight: '350px',
  overflow: 'auto'
});

export interface StatefulFiltersProps {
  childrenFirst?: boolean;
  initialFilters: FilterType[];
  initialToggles?: ToggleType[];
  onFilterChange: (active: ActiveFiltersInfo) => void;
  onToggleChange?: (active: ActiveTogglesInfo) => void;
  ref?: React.RefObject<StatefulFilters>;
}

interface StatefulFiltersState {
  activeFilters: ActiveFiltersInfo;
  activeToggles: number;
  currentFilterType: FilterType;
  currentValue: string;
  filterTypes: FilterType[];
  focusedItemIndex: number | null;
  isOpen: boolean;
}

export class FilterSelected {
  static selectedFilters: ActiveFilter[] | undefined = undefined;
  static opSelected: LabelOperation;

  static init = (filterTypes: FilterType[]): ActiveFiltersInfo => {
    let active = FilterSelected.getSelected();
    if (!FilterSelected.isInitialized()) {
      active = FilterHelper.getFiltersFromURL(filterTypes);
      FilterSelected.setSelected(active);
    } else if (!FilterHelper.filtersMatchURL(filterTypes, active)) {
      active = FilterHelper.setFiltersToURL(filterTypes, active);
      FilterSelected.setSelected(active);
    }
    return active;
  };

  static resetFilters = (): void => {
    FilterSelected.selectedFilters = undefined;
  };

  static setSelected = (activeFilters: ActiveFiltersInfo): void => {
    FilterSelected.selectedFilters = activeFilters.filters;
    FilterSelected.opSelected = activeFilters.op;
  };

  static getSelected = (): ActiveFiltersInfo => {
    return { filters: FilterSelected.selectedFilters || [], op: FilterSelected.opSelected || 'or' };
  };

  static isInitialized = (): boolean => {
    return FilterSelected.selectedFilters !== undefined;
  };
}

// Column toggles
export class Toggles {
  static checked: ActiveTogglesInfo = new Map<string, boolean>();
  static numChecked = 0;

  static init = (toggles: ToggleType[]): number => {
    Toggles.checked.clear();
    Toggles.numChecked = 0;

    // Prefer URL settings
    const urlParams = new URLSearchParams(history.location.search);
    toggles.forEach(t => {
      const urlIsChecked = HistoryManager.getBooleanParam(`${t.name}Toggle`, urlParams);
      const isChecked = urlIsChecked === undefined ? t.isChecked : urlIsChecked;
      Toggles.checked.set(t.name, isChecked);
      if (isChecked) {
        Toggles.numChecked++;
      }
    });
    return Toggles.numChecked;
  };

  static setToggle = (name: string, value: boolean): number => {
    HistoryManager.setParam(`${name}Toggle`, `${value}`);
    Toggles.checked.set(name, value);
    Toggles.numChecked = value ? Toggles.numChecked++ : Toggles.numChecked--;
    return Toggles.numChecked;
  };

  static getToggles = (): ActiveTogglesInfo => {
    return new Map<string, boolean>(Toggles.checked);
  };
}

const dividerStyle = kialiStyle({
  borderRight: `1px solid ${PFColors.ColorLight300}`,
  padding: '10px',
  display: 'inherit'
});

const paddingStyle = kialiStyle({ padding: '0 10px 10px 10px' });

export class StatefulFilters extends React.Component<StatefulFiltersProps, StatefulFiltersState> {
  private promises = new PromisesRegistry();

  constructor(props: StatefulFiltersProps) {
    super(props);
    this.state = {
      activeFilters: FilterSelected.init(this.props.initialFilters),
      activeToggles: Toggles.init(this.props.initialToggles || []),
      currentFilterType: this.props.initialFilters[0],
      filterTypes: this.props.initialFilters,
      isOpen: false,
      currentValue: '',
      focusedItemIndex: null
    };
  }

  componentDidMount(): void {
    this.loadDynamicFilters();
  }

  private loadDynamicFilters(): void {
    // Call all loaders from FilterTypes and set results in state
    const filterTypePromises = this.props.initialFilters.map(ft => {
      if (ft.loader) {
        return ft.loader().then(values => {
          ft.filterValues = values;
          return {
            category: ft.category,
            placeholder: ft.placeholder,
            filterType: ft.filterType,
            action: ft.action,
            filterValues: ft.filterValues
          };
        });
      } else {
        return Promise.resolve(ft);
      }
    });

    this.promises
      .registerAll('filterType', filterTypePromises)
      .then(types => this.setState({ filterTypes: types }))
      .catch(err => {
        if (!err.isCanceled) {
          console.debug(err);
        }
      });
  }

  private getCurrentFilterTypes(): FilterType {
    return (
      this.props.initialFilters.find(f => f.category === this.state.currentFilterType.category) ??
      this.props.initialFilters[0]
    );
  }

  componentDidUpdate(prevProps: StatefulFiltersProps, prevState: StatefulFiltersState): void {
    // If the props filters changed (e.g. different values), some state update is necessary
    if (
      this.props.initialFilters !== prevProps.initialFilters &&
      !arrayEquals(this.props.initialFilters, prevProps.initialFilters, (t1, t2) => {
        return (
          t1.category === t2.category &&
          arrayEquals(t1.filterValues, t2.filterValues, (v1, v2) => {
            return v1.id === v2.id && v1.title === v2.title;
          })
        );
      })
    ) {
      const current = this.getCurrentFilterTypes();
      const active = FilterHelper.setFiltersToURL(this.props.initialFilters, this.state.activeFilters);
      this.setState({
        currentFilterType: current,
        filterTypes: this.props.initialFilters,
        activeFilters: active
      });
      this.loadDynamicFilters();
    } else if (!FilterHelper.filtersMatchURL(this.state.filterTypes, this.state.activeFilters)) {
      FilterHelper.setFiltersToURL(this.state.filterTypes, this.state.activeFilters);
    }

    // If the input text changes in typeahead, filter the select options according to the input text value
    if (
      this.state.currentFilterType.filterType === AllFilterTypes.typeAhead &&
      this.state.currentValue !== prevState.currentValue
    ) {
      const current = Object.assign({}, this.getCurrentFilterTypes());
      current.filterValues = current.filterValues.filter(menuItem =>
        String(menuItem.title).toLowerCase().includes(this.state.currentValue.toLowerCase())
      );
      this.setState({
        currentFilterType: current,
        isOpen: true
      });
    }
  }

  componentWillUnmount(): void {
    this.promises.cancelAll();
  }

  updateActiveFilters(activeFilters: ActiveFiltersInfo): void {
    const cleanFilters = FilterHelper.setFiltersToURL(this.state.filterTypes, activeFilters);
    FilterSelected.setSelected(cleanFilters);
    this.setState({ activeFilters: cleanFilters, currentValue: '' });
    this.props.onFilterChange(cleanFilters);
  }

  filterAdded = (field: FilterType, value: string): void => {
    const activeFilters = this.state.activeFilters;
    const activeFilter: ActiveFilter = {
      category: field.category,
      value: value
    };

    // For filters that need to be updated in place instead of added, we check if it is already defined in activeFilters
    const current = activeFilters.filters.filter(filter => filter.category === field.category);
    if (field.action === FILTER_ACTION_UPDATE && current.length > 0) {
      current.forEach(filter => (filter.value = value));
    } else {
      activeFilters.filters.push(activeFilter);
    }

    this.updateActiveFilters(activeFilters);
  };

  selectFilterType = (value: string): void => {
    const { currentFilterType } = this.state;
    const filterType = this.state.filterTypes.filter(filter => filter.category === value)[0];

    if (currentFilterType !== filterType) {
      this.setState({
        currentValue: '',
        currentFilterType: filterType
      });
    }
  };

  filterValueSelected = (valueId?: string | number): void => {
    const { currentFilterType } = this.state;
    const filterValue = currentFilterType.filterValues.find(filter => filter.id === valueId);

    if (filterValue && !this.isActive(currentFilterType, filterValue.title)) {
      this.filterAdded(currentFilterType, filterValue.title);
    }

    setTimeout(() => this.setState({ isOpen: false }));
  };

  updateCurrentValue = (value: string): void => {
    this.setState({ currentValue: value, focusedItemIndex: null });
  };

  onValueKeyDown = (keyEvent: React.KeyboardEvent): void => {
    const { currentValue, currentFilterType } = this.state;

    if (keyEvent.key === 'Enter') {
      if (currentValue && currentValue.length > 0 && !this.isActive(currentFilterType, currentValue)) {
        this.filterAdded(currentFilterType, currentValue);
      }

      this.setState({ currentValue: '' });
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
    }
  };

  onTypeaheadInputKeyDown = (keyEvent: React.KeyboardEvent): void => {
    const { isOpen, focusedItemIndex, currentFilterType } = this.state;

    if (keyEvent.key === 'ArrowUp' || keyEvent.key === 'ArrowDown') {
      let indexToFocus: number | null = null;

      if (this.state.isOpen) {
        if (keyEvent.key === 'ArrowUp') {
          // When no index is set or at the first index, focus to the last, otherwise decrement focus index
          if (focusedItemIndex === null || focusedItemIndex === 0) {
            indexToFocus = currentFilterType.filterValues.length - 1;
          } else {
            indexToFocus = focusedItemIndex - 1;
          }
        } else if (keyEvent.key === 'ArrowDown') {
          // When no index is set or at the last index, focus to the first, otherwise increment focus index
          if (focusedItemIndex === null || focusedItemIndex === currentFilterType.filterValues.length - 1) {
            indexToFocus = 0;
          } else {
            indexToFocus = focusedItemIndex + 1;
          }
        }

        this.setState({ focusedItemIndex: indexToFocus });
      }
    } else if (keyEvent.key === 'Enter') {
      const focusedItem = focusedItemIndex !== null ? currentFilterType.filterValues[focusedItemIndex] : null;

      if (isOpen && focusedItem) {
        this.filterValueSelected(focusedItem.id);
        this.setState({ currentValue: '', focusedItemIndex: null });
      }
    }
  };

  isActive = (type: FilterType, value: string): boolean => {
    return this.state.activeFilters.filters.some(active => value === active.value && type.category === active.category);
  };

  removeFilter = (category: string | any, value: string | any): void => {
    const updated = this.state.activeFilters.filters.filter(x => x.category !== category || x.value !== value);
    if (updated.length !== this.state.activeFilters.filters.length) {
      this.updateActiveFilters({ filters: updated, op: this.state.activeFilters.op });
    }
  };

  clearFilters = (): void => {
    this.updateActiveFilters({ filters: [], op: DEFAULT_LABEL_OPERATION });
  };

  onToggle = (): void => {
    this.setState({
      isOpen: !this.state.isOpen
    });
  };

  onCheckboxChange = (checked: boolean, event: React.FormEvent<HTMLInputElement>): void => {
    this.setState({ activeToggles: Toggles.setToggle(event.currentTarget.name, checked) });
    if (this.props.onToggleChange) {
      this.props.onToggleChange(Toggles.getToggles());
    }
  };

  getMenuToggle() {
    return (toggleRef: React.Ref<MenuToggleElement>): React.ReactElement => (
      <MenuToggle
        ref={toggleRef}
        variant="typeahead"
        onClick={this.onToggle}
        isExpanded={this.state.isOpen}
        isFullWidth
      >
        <TextInputGroup isPlain>
          <TextInputGroupMain
            value={this.state.currentValue}
            onClick={this.onToggle}
            onChange={(_event, value) => this.updateCurrentValue(value)}
            id="typeahead-select-input"
            autoComplete="off"
            onKeyDown={this.onTypeaheadInputKeyDown}
            placeholder={this.state.currentFilterType.placeholder}
            role="combobox"
            isExpanded={this.state.isOpen}
            aria-controls="select-typeahead-listbox"
          />
        </TextInputGroup>
      </MenuToggle>
    );
  }

  renderInput(): React.ReactNode {
    const { currentFilterType, currentValue } = this.state;

    if (!currentFilterType) {
      return null;
    }

    if (currentFilterType.filterType === AllFilterTypes.typeAhead) {
      const toggle = this.getMenuToggle();

      return (
        <Select
          onSelect={(_event, value) => this.filterValueSelected(value)}
          onOpenChange={isOpen => this.setState({ isOpen })}
          toggle={toggle}
          isOpen={this.state.isOpen}
          aria-label="filter_select_value"
          className={filterSelectStyle}
        >
          <SelectList data-test="istio-type-dropdown">
            {currentFilterType.filterValues.length > 0 ? (
              currentFilterType.filterValues.map((filter, index) => (
                <SelectOption
                  key={`filter_${index}`}
                  value={filter.id}
                  isFocused={this.state.focusedItemIndex === index}
                  label={filter.title}
                >
                  {filter.title}
                </SelectOption>
              ))
            ) : (
              <SelectOption key="filter_no_results" value="no_results" isDisabled={true}>
                No results found
              </SelectOption>
            )}
          </SelectList>
        </Select>
      );
    } else if (currentFilterType.filterType === AllFilterTypes.select) {
      return (
        //TODO: Replace by Select component when https://github.com/patternfly/patternfly-react/issues/9698 is fixed
        <FormSelect
          value="default"
          onChange={(_event, valueId: string) => this.filterValueSelected(valueId)}
          aria-label="filter_select_value"
          style={{ width: 'auto', paddingRight: '2rem' }}
        >
          <FormSelectOption key={'filter_default'} value={'default'} label={currentFilterType.placeholder} />
          {currentFilterType.filterValues.map((filter, index) => (
            <FormSelectOption key={`filter_${index}`} value={filter.id} label={filter.title} />
          ))}
        </FormSelect>
      );
    } else if (
      currentFilterType.filterType === AllFilterTypes.label ||
      currentFilterType.filterType === AllFilterTypes.nsLabel
    ) {
      return (
        <LabelFilters
          value={currentValue}
          onChange={this.updateCurrentValue}
          filterAdd={value => this.filterAdded(currentFilterType, value)}
          isActive={value => this.isActive(currentFilterType, value)}
        />
      );
    } else {
      return (
        <TextInput
          type={currentFilterType.filterType as TextInputTypes}
          value={currentValue}
          aria-label="filter_input_value"
          placeholder={currentFilterType.placeholder}
          onChange={(_event, value) => this.updateCurrentValue(value)}
          onKeyDown={e => this.onValueKeyDown(e)}
          style={{ width: 'auto' }}
        />
      );
    }
  }

  renderChildren = (): React.ReactNode => {
    return (
      this.props.children && (
        <ToolbarGroup style={{ marginRight: '10px' }}>
          {Array.isArray(this.props.children) ? (
            (this.props.children as Array<any>).map(
              (child, index) =>
                child && (
                  <ToolbarItem
                    key={`toolbar_statefulFilters_${index}`}
                    className={index === (this.props.children as Array<any>).length - 1 ? paddingStyle : dividerStyle}
                  >
                    {child}
                  </ToolbarItem>
                )
            )
          ) : (
            <ToolbarItem>{this.props.children}</ToolbarItem>
          )}
        </ToolbarGroup>
      )
    );
  };

  render(): React.ReactNode {
    const showIncludeToggles = serverConfig.kialiFeatureFlags.uiDefaults.list.showIncludeToggles;
    const { currentFilterType, activeFilters } = this.state;
    const filterOptions = this.state.filterTypes.map(option => (
      <FormSelectOption key={option.category} value={option.category} label={option.category} />
    ));
    const hasActiveFilters =
      this.state.activeFilters.filters.some(f => f.category === labelFilter.category) ||
      this.state.currentFilterType.filterType === AllFilterTypes.label;
    return (
      <>
        <Toolbar id="filter-selection" className={toolbarStyle} clearAllFilters={this.clearFilters}>
          {this.props.childrenFirst && this.renderChildren()}
          <ToolbarContent>
            <ToolbarGroup variant="filter-group">
              {this.state.filterTypes.map((ft, i) => {
                return (
                  <ToolbarFilter
                    key={`toolbar_filter-${ft.category}`}
                    chips={activeFilters.filters.filter(af => af.category === ft.category).map(af => af.value)}
                    deleteChip={this.removeFilter}
                    categoryName={ft.category}
                  >
                    {i === 0 && (
                      <FormSelect
                        value={currentFilterType.category}
                        aria-label="filter_select_type"
                        onChange={(_event, value: string) => this.selectFilterType(value)}
                        className={formSelectStyle}
                      >
                        {filterOptions}
                      </FormSelect>
                    )}
                    {i === 0 && this.renderInput()}
                  </ToolbarFilter>
                );
              })}
            </ToolbarGroup>
            <ToolbarGroup>
              {showIncludeToggles &&
                this.props.initialToggles &&
                this.props.initialToggles.map((t, i) => {
                  return (
                    <ToolbarItem key={`toggle-${i}`}>
                      <Checkbox
                        data-test={`toggle-${t.name}`}
                        id={t.name}
                        isChecked={Toggles.checked.get(t.name)}
                        label={t.label}
                        name={t.name}
                        onChange={(event, checked: boolean) => this.onCheckboxChange(checked, event)}
                      />
                    </ToolbarItem>
                  );
                })}
            </ToolbarGroup>
            {!this.props.childrenFirst && this.renderChildren()}
            {hasActiveFilters && (
              <ToolbarGroup>
                <ToolbarItem>
                  <div className={paddingStyle}>Label Operation</div>
                  <FormSelect
                    value={activeFilters.op}
                    onChange={(_event, value) =>
                      this.updateActiveFilters({
                        filters: this.state.activeFilters.filters,
                        op: value as LabelOperation
                      })
                    }
                    aria-label="filter_select_value"
                    style={{ width: 'auto' }}
                  >
                    <FormSelectOption key="filter_or" value="or" label="or" />
                    <FormSelectOption key="filter_and" value="and" label="and" />
                  </FormSelect>
                </ToolbarItem>
              </ToolbarGroup>
            )}
          </ToolbarContent>
        </Toolbar>
        <div className={bottomPadding} />
      </>
    );
  }
}
