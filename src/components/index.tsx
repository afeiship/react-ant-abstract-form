import classNames from 'classnames';
import React, { Component, ReactNode } from 'react';
import { Form, Card, Button, message } from 'antd';
import FormBuilder from 'antd-form-builder';
import nx from '@jswork/next';
import nxIsEmptyObject from '@jswork/next-is-empty-object';
import ReactAdminIcons from '@jswork/react-admin-icons';
import { CardSize } from 'antd/es/card';
import hotkeys from 'hotkeys-js';

const CLASS_NAME = 'react-ant-abstract-form';
const HOT_KEYS = 'cmd+s';
const registerKey = (inName, inCallback) => {
  hotkeys(inName, inCallback);
  return {
    destroy: () => hotkeys.unbind(inName, inCallback)
  };
};

// https://github.com/rekit/antd-form-builder
// https://rekit.github.io/antd-form-builder/examples-v4/

export interface ReactAntAbstractFormProps {
  /**
   * The extended className for component.
   */
  className?: string;
}

interface ReactAntAbstractFormState {
  meta: any;
}

export default class ReactAntAbstractForm extends Component<
  ReactAntAbstractFormProps,
  ReactAntAbstractFormState
> {
  static displayName = CLASS_NAME;
  static version = '__VERSION__';
  static defaultProps = {};

  private hotkeysRes;

  resources = 'curds';
  size: CardSize = 'small';
  options = {};
  actions = {
    reset: true,
    back: true,
    redirect: true
  };

  routeService: any;
  apiService: any;
  formRef: any;

  constructor(inProps) {
    super(inProps);
    this.handleValuesChange = this.handleValuesChange.bind(this);
    this.hotkeysRes = registerKey(HOT_KEYS, this.handleHotkey);
    this.state = {
      meta: {}
    };
  }

  get titleView() {
    return (
      <span className="mr-5_ mr_">
        <ReactAdminIcons value="form" />
        <span>操作面板</span>
      </span>
    );
  }

  get params() {
    return nx.get(this.props, 'match.params');
  }

  get isEdit() {
    return !nxIsEmptyObject(this.params);
  }

  get extraView() {
    return (
      <div className="is-extra">
        <Button size={'small'} onClick={() => this.routeService.back()}>
          <ReactAdminIcons size={12} value="return" />
          返回
        </Button>
      </div>
    );
  }

  get submitView() {
    const { reset, back } = this.actions;
    const { formItemLayout } = this.state.meta;
    return (
      <Form.Item wrapperCol={{ span: formItemLayout[1], offset: formItemLayout[0] }}>
        <div className="mr-10_ mr_">
          <Button htmlType="submit" type="primary">
            保存
          </Button>
          {reset && (
            <Button htmlType="reset" type="default">
              取消
            </Button>
          )}
          {back && (
            <Button type="default" onClick={() => this.routeService.back()}>
              返回
            </Button>
          )}
        </div>
      </Form.Item>
    );
  }

  componentDidMount() {
    this.handleInit();
    // route service is async
    setTimeout(() => {
      nx.set(this.routeService, 'current', this.props);
    }, 0);
  }

  componentWillUnmount() {
    this.hotkeysRes.destroy();
  }

  /**
   * Template method.
   * @param {*} inData
   * @returns
   */
  setResponse(inData) {
    return inData;
  }

  save(inEvent, inRedirect) {
    const action = this.isEdit ? 'update' : 'create';
    const data = nx.mix(null, this.params, inEvent, this.options);
    return new Promise((resolve, reject) => {
      this.apiService[`${this.resources}_${action}`](data)
        .then((res) => {
          message.success('操作成功');
          inRedirect && this.routeService.back();
          resolve(res);
        })
        .catch(reject);
    });
  }

  handleHotkey = (inEvent) => {
    inEvent.preventDefault();
    this.save(this.formRef.getFieldsValue(), false);
  };

  handleInit() {
    if (this.isEdit) {
      const data = nx.mix(null, this.params, this.options);
      const { meta } = this.state;
      this.apiService[`${this.resources}_show`](data).then((res) => {
        const response = this.setResponse(res);
        nx.mix(meta.initialValues, response);
        this.setState({ meta });
        this.formRef.setFieldsValue(response);
      });
    }
    return Promise.resolve();
  }

  handleFinish = (inEvent) => {
    const { redirect } = this.actions;
    return this.save(inEvent, redirect);
  };

  // @ts-ignore
  handleValuesChange(inValues?, inAllValues?) {
    this.forceUpdate();
  }

  view(): ReactNode {
    const { className } = this.props;
    const { meta } = this.state;
    return (
      <Card
        size={this.size}
        title={this.titleView}
        extra={this.extraView}
        data-component={CLASS_NAME}
        className={classNames(CLASS_NAME, className)}>
        <Form
          ref={(formRef) => (this.formRef = formRef)}
          onFinish={this.handleFinish}
          onValuesChange={this.handleValuesChange}>
          <FormBuilder meta={meta} form={this.formRef} />
          {this.submitView}
        </Form>
      </Card>
    );
  }

  render(): ReactNode {
    return null;
  }
}
