var React = require('react');
var ReactNative = require('react-native');

var {
  PanResponder,
  View,
  TouchableHighlight,
  Animated,
} = ReactNative;

var MaterialSwitch = React.createClass({
  padding: 10,

  getDefaultProps() {
    return {
      value: false,
      style: {},
      inactiveButtonColor: '#2196F3',
      inactiveButtonPressedColor: '#42A5F5',
      activeButtonColor: '#FAFAFA',
      activeButtonPressedColor: '#F5F5F5',
      buttonShadow: {
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 1,
        shadowOffset: { height: 1, width: 0 },
      },
      activeBackgroundColor: 'rgba(255,255,255,.5)',
      inactiveBackgroundColor: 'rgba(0,0,0,.5)',
      buttonRadius: 15,
      switchWidth: 40,
      switchHeight: 20,
      buttonContent: null,
      enableSlide: true,
      switchAnimationTime: 200,
      onActivate: function() {},
      onDeactivate: function() {},
      onValueChange: function() {},
    };
  },

  getInitialState() {
    var w = this.props.switchWidth - Math.min(this.props.switchHeight, this.props.buttonRadius*2);
    return {
      width: w,
      position: new Animated.Value(this.props.value? w : 0),
    };
  },

  start: {},

  componentWillMount: function() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        if (!this.props.enableSlide) return;

        this.setState({pressed: true});
        this.start.x0 = gestureState.x0;
        this.start.pos = this.state.position._value;
        this.start.moved = false;
        this.start.state = this.props.value;
        this.start.stateChanged = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!this.props.enableSlide) return;

        this.start.moved = true;
        if (this.start.pos == 0) {
          if (gestureState.dx <= this.state.width && gestureState.dx >= 0) {
            this.state.position.setValue(gestureState.dx);
          }
          if (gestureState.dx > this.state.width) {
            this.state.position.setValue(this.state.width);
          }
          if (gestureState.dx < 0) {
            this.state.position.setValue(0);
          }
        }
        if (this.start.pos == this.state.width) {
          if (gestureState.dx >= -this.state.width && gestureState.dx <= 0) {
            this.state.position.setValue(this.state.width+gestureState.dx);
          }
          if (gestureState.dx > 0) {
            this.state.position.setValue(this.state.width);
          }
          if (gestureState.dx < -this.state.width) {
            this.state.position.setValue(0);
          }
        }
        var currentPos = this.state.position._value;
        this.onSwipe(currentPos, this.start.pos,
          () => {
            if (!this.start.state) this.start.stateChanged = true;
          },
          ()=>{
            if (this.start.state) this.start.stateChanged = true;
          });
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.setState({pressed: false});
        var currentPos = this.state.position._value;
        if (!this.start.moved || (Math.abs(currentPos-this.start.pos)<5 && !this.start.stateChanged)) {
          this.toggle();
          return;
        }
        this.onSwipe(currentPos, this.start.pos, this.activate, this.deactivate);
      },
      onPanResponderTerminate: (evt, gestureState) => {
        var currentPos = this.state.position._value;
        this.setState({pressed: false});
        this.onSwipe(currentPos, this.start.pos, this.activate, this.deactivate);
      },
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    });
  },

  onSwipe(currentPosition, startingPosition, onChange, onTerminate) {
    if (currentPosition-startingPosition >= 0) {
      if (currentPosition-startingPosition > this.state.width/2 || startingPosition == this.state.width) {
        onChange();
      } else {
        onTerminate();
      }
    } else {
      if (currentPosition-startingPosition < -this.state.width/2) {
        onTerminate();
      } else {
        onChange();
      }
    }
  },

  activate() {
    console.warn('ACTIVATE')
    Animated.timing(
      this.state.position,
      {
        toValue: this.state.width,
        duration: this.props.switchAnimationTime,
      }
    ).start();
    this.changeState(true);
  },

  deactivate() {
    Animated.timing(
      this.state.position,
      {
        toValue: 0,
        duration: this.props.switchAnimationTime,
      }
    ).start();
    this.changeState(false);
  },

  changeState(state) {
    var callHandlers = this.start.state != state;
    setTimeout(() => {
      if (callHandlers) {
        this.props.onValueChange(state);
      }
    }, this.props.switchAnimationTime/2);
  },

  toggle() {
    if (!this.props.enableSlide) return;

    if (this.props.value) {
      this.deactivate();
    } else {
      this.activate();
    }
  },
  componentWillReceiveProps(nextProps){
    console.warn('NEXTPROPS: ', nextProps.value)
    setTimeout(() => {
      if(nextProps.value && this.state.position._value !== this.state.width){
        Animated.timing(
          this.state.position,
          {
            toValue: this.state.width,
            duration: this.props.switchAnimationTime,
          }
        ).start();
      }
      if(!nextProps.value && this.state.position._value !== 0){
        Animated.timing(
          this.state.position,
          {
            toValue: 0,
            duration: this.props.switchAnimationTime,
          }
        ).start();
      }

    }, 200)


  },

  render() {
    let width = this.state.width
    let color = this.state.position.interpolate({
      inputRange: [0, width / 3, (width / 3) *2,  width],
      outputRange: ['rgba(241, 241, 241, 1)', 'rgba(241, 241, 241, 0.5)', 'rgba(60, 227, 95, 0.5)', 'rgba(60, 227, 95, 1)']
    })
    var doublePadding = this.padding*2-2;
    var halfPadding = doublePadding/2;
    return (
      <View
        {...this._panResponder.panHandlers}
        style={{padding: this.padding, position: 'relative'}}>
        <View
          style={{
            backgroundColor: this.props.value ? this.props.activeBackgroundColor : this.props.inactiveBackgroundColor,
            height: this.props.switchHeight,
            width: this.props.switchWidth,
            borderRadius: this.props.switchHeight/2,
          }}/>
        <TouchableHighlight underlayColor='transparent' activeOpacity={1} style={{
          height: Math.max(this.props.buttonRadius*2+doublePadding, this.props.switchHeight+doublePadding),
          width: this.props.switchWidth+doublePadding,
          position: 'absolute',
          top: 1,
          left: 1
        }}>
          <Animated.View style={[{
            backgroundColor: color,
            height: this.props.buttonRadius*2,
            width: this.props.buttonRadius*2,
            borderRadius: this.props.buttonRadius,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            position: 'absolute',
            top: halfPadding + this.props.switchHeight/2 - this.props.buttonRadius,
            left: this.props.switchHeight/2 > this.props.buttonRadius ? halfPadding : halfPadding + this.props.switchHeight/2 - this.props.buttonRadius,
            transform: [{ translateX: this.state.position }],
            elevation: 5
          },
            this.props.buttonShadow]}
          >
            {this.props.buttonContent}
          </Animated.View>
        </TouchableHighlight>
      </View>
    )
  }
});

module.exports = MaterialSwitch;

