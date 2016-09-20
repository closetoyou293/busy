var React = require('react'),
  ReactRedux = require('react-redux'),
  actions = require('./../actions'),
  formatter = require('steem/lib/formatter'),
  _ = require('lodash'),
  numeral = require('numeral'),
  api = require('./../steemAPI'),
  Loading = require('./../widgets/Loading'),
  Link = require('react-router').Link;

var Sidebar = React.createClass({
  getInitialState: function() {
    api.getState('trending/busy', function(err, result) {
      this.setState({
        isFetching: false,
        isLoaded: true,
        categories: result.categories,
        props: result.props,
        feedPrice: result.feed_price
      });
    }.bind(this));
    return {
      isFetching: true,
      isLoaded: false,
      followingIsFetching: false,
      followingIsLoaded: false,
      categories: [],
      props: {},
      feedPrice: {},
      following: [],
      menu: 'public'
    };
  },
  getFollowing: function(){
    if (this.props.auth.isAuthenticated === true
      && _.size(this.state.following) == 0
      && this.state.followingIsFetching == false
      && this.state.followingIsLoaded == false
    ) {
      api.getFollowing(this.props.auth.user.name, 0, 'blog', 20, function(err, following) {
        this.setState({following: following});
      }.bind(this));
    }
  },
  render: function(){
    this.getFollowing();
    var user = this.props.auth.user;
    var tags = [];
    if (this.state.categories) {
      var categories = _.sortBy(this.state.categories, 'discussions').reverse();
      categories.forEach(function(category, key) {
        tags.push(<li key={key}><Link to={'/trending/' + category.name} activeClassName="active">#{category.name}</Link></li>);
      });
    }
    tags = _.sortBy(tags, 'discussions');
    tags = tags.slice(0, 20);
    if (_.has(this.state.feedPrice, 'base')) {
      var power = formatter.vestToSteem(user.vesting_shares, this.state.props.total_vesting_shares, this.state.props.total_vesting_fund_steem);
      var base = (this.state.feedPrice.base).replace(' SBD', '').replace(',', '');
      var dollar = (parseFloat(base) * (parseFloat(user.balance) + parseFloat(power))) + parseFloat(user.sbd_balance);
    }
    return (
      <nav className="sidebar">
        <div className="sidebar-header">
          {this.props.app.sidebarIsVisible &&
          <a className="visible-xs hide-sidebar" href="#" onClick={() => this.props.hideSidebar()}>
            <i className="icon icon-md icon-menu material-icons">arrow_back</i>
          </a>}
          <div className="me">
            {this.props.auth.isAuthenticated?
              <Link to={'/@' + user.name}>
                <span className="avatar avatar-sm">
                  <span className="reputation">{formatter.reputation(user.reputation)}</span>
                  <img src={`https://img.busy6.com/@${user.name}`} />
                </span>
                <span style={{clear: 'both', display: 'block'}}>@{user.name} <Link to="/settings" onClick={() => this.setState({menu: 'settings'})}><i className="icon icon-xs material-icons">settings</i></Link></span>
              </Link> :
              <div className="log">
                <a href="https://steemconnect.com/authorize/@busy"><i className="icon icon-lg material-icons pam">lock_outline</i></a>
              </div>}
          </div>
        </div>
        {this.props.auth.isAuthenticated && <ul className="list-selector">
          <li><a onClick={() => this.setState({menu: 'public'})} className="active"><i className="icon icon-md material-icons">public</i></a></li>
          <li><a onClick={() => this.setState({menu: 'feed'})}  className="active"><i className="icon icon-md material-icons">chat_bubble_outline</i></a></li>
          <li><a onClick={() => this.setState({menu: 'write'})} className="active"><i className="icon icon-md material-icons">create</i></a></li>
          <li><a onClick={() => this.setState({menu: 'wallet'})} className="active"><i className="icon icon-md material-icons">account_balance_wallet</i></a></li>
        </ul>}
        <div className="sidebar-content">
          {this.state.isFetching && <Loading color="white"/>}
          {this.props.auth.isAuthenticated && _.has(this.state.feedPrice, 'base') && this.state.menu === 'settings' &&
            <ul>
              <li className="title">
                <Link to="/#profile"><i className="icon icon-md material-icons">perm_identity</i> Profile</Link>
              </li>
              <li className="title">
                <Link to="/settings"><i className="icon icon-md material-icons">settings</i> Settings</Link>
              </li>
              <li className="title">
                <Link to="/about"><i className="icon icon-md material-icons">info_outline</i> About</Link>
              </li>
              <li className="title">
                <a href="https://steemconnect.com/logout"><i className="icon icon-md material-icons">lock_open</i> Log Out</a>
              </li>
            </ul>}
          {_.size(this.state.categories) > 0 && this.state.menu === 'public' && <ul className="tags">{tags}</ul>}
          {_.size(this.state.following) > 0 && this.state.menu === 'feed' &&
            <ul className="tags">
              {this.state.following.map(function(follow, key) {
                return <li key={key}><Link to={'/@' + follow.following} activeClassName="active">@{follow.following}</Link></li>
              })}
            </ul>}
          {this.props.auth.isAuthenticated && _.has(this.state.feedPrice, 'base') && this.state.menu === 'write' &&
            <ul>
              <li className="title">
                <Link to="/write">
                  <i className="icon icon-md material-icons">add</i> Write
                </Link>
              </li>
              <li className="title">
                <Link to="/#drafts"><i className="icon icon-md material-icons">library_books</i> Drafts</Link>
              </li>
              <li className="title">
                <Link to="/#files"><i className="icon icon-md material-icons">attach_file</i> Files</Link>
              </li>
              <li className="title">
                <Link to="/#bookmarks"><i className="icon icon-md material-icons">collections_bookmark</i> Bookmarks</Link>
              </li>
            </ul>}
          {this.props.auth.isAuthenticated && _.has(this.state.feedPrice, 'base') && this.state.menu === 'wallet' &&
            <ul className="tags">
              <li><span className="menu-row">1 Steem <span className="pull-right">{numeral(base).format('$0,0.00')}</span></span></li>
              <li><span className="menu-row">Steem <span className="pull-right">{numeral(user.balance).format('0,0.00')}</span></span></li>
              <li><span className="menu-row">Steem Power <span className="pull-right">{numeral(power).format('0,0.00')}</span></span></li>
              <li><span className="menu-row">Steem Dollars <span className="pull-right">{numeral(user.sbd_balance).format('0,0.00')}</span></span></li>
              <li><span className="menu-row">Steem Dollars <span className="pull-right">{numeral(dollar).format('$0,0.00')}</span></span></li>
            </ul>}
        </div>
      </nav>
    );
  }
});

var mapStateToProps = function(state){
  return {
    app: state.app,
    auth: state.auth
  };
};

var mapDispatchToProps = function(dispatch){
  return {
    hideSidebar: function(){ dispatch(actions.hideSidebar()); }
  }
};

module.exports = ReactRedux.connect(mapStateToProps,mapDispatchToProps)(Sidebar);