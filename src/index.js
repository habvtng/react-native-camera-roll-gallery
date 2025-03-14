import React from "react";
import PropTypes from "prop-types";
import {
  Text,
  Modal,
  Platform,
  StyleSheet,
  SafeAreaView,
  View
} from "react-native";
import CameraRollBrowser from "./CameraRollBrowser";
import ImageViewer from "./ImageViewer";

export default class CameraRollGallery extends React.PureComponent {
  static propTypes = {
    enableCameraRoll: PropTypes.bool,
    onGetData: PropTypes.func,
    itemCount: PropTypes.number,
    imagesPerRow: PropTypes.number,
    initialNumToRender: PropTypes.number,
    removeClippedSubviews: PropTypes.bool,
    cameraRollFlatListProps: PropTypes.object,
    catchGetPhotosError: PropTypes.func,
    groupTypes: PropTypes.oneOf([
      "Album",
      "All",
      "Event",
      "Faces",
      "Library",
      "PhotoStream",
      "SavedPhotos",
    ]),
    assetType: PropTypes.oneOf([
      "Photos",
      "Videos",
      "All",
    ]),
    imageMargin: PropTypes.number,
    containerWidth: PropTypes.number,
    backgroundColor: PropTypes.string,
    emptyText: PropTypes.string,
    emptyTextStyle: Text.propTypes.style,
    loader: PropTypes.node,
    cameraRollListHeader: PropTypes.func,
    cameraRollListFooter: PropTypes.func,
    imageContainerStyle: PropTypes.object,
    renderIndividualHeader: PropTypes.func,
    renderIndividualFooter: PropTypes.func,
    loaderColor: PropTypes.string,
    permissionDialogTitle: PropTypes.string,
    permissionDialogMessage: PropTypes.string,
    pendingAuthorizedView: PropTypes.oneOfType([
      PropTypes.node,
      // PropTypes.func
    ]),
    notAuthorizedView: PropTypes.oneOfType([
      PropTypes.node,
      // PropTypes.func
    ]),

    imagePageComponent: PropTypes.func,
    errorPageComponent: PropTypes.func,
    pagesFlatListProps: PropTypes.object,
    pageMargin: PropTypes.number,
    sensitivePageScroll: PropTypes.bool,
    onPageSelected: PropTypes.func,
    onPageScrollStateChanged: PropTypes.func,
    onPageScroll: PropTypes.func,
    pageScrollViewStyle: PropTypes.object,
    onPageSingleTapConfirmed: PropTypes.func,
    onPageLongPress: PropTypes.func,
    renderPageHeader: PropTypes.func,
    renderPageFooter: PropTypes.func,
    renderChildImageViewer: PropTypes.func,

    onDoubleTapConfirmed: PropTypes.func,
    onDoubleTapStartReached: PropTypes.func,
    onDoubleTapEndReached: PropTypes.func,
    onPinchTransforming: PropTypes.func,
    onPinchStartReached: PropTypes.func,
    onPinchEndReached: PropTypes.func,
    onOpenImageViewer: PropTypes.func,
    onCloseImageViewer: PropTypes.func,
    enableScale: PropTypes.bool,
    enableTranslate: PropTypes.bool,
    resizeMode: PropTypes.string,
    enableResistance: PropTypes.bool,
    resistantStrHorizontal: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.number,
      PropTypes.string
    ]),
    resistantStrVertical: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.number,
      PropTypes.string
    ]),
    onViewTransformed: PropTypes.func,
    onTransformGestureReleased: PropTypes.func,
    onSwipeUpReleased: PropTypes.func,
    onSwipeDownReleased: PropTypes.func,
    maxScale: PropTypes.bool,
    maxOverScrollDistance: PropTypes.number,
    enableVerticalExit: PropTypes.bool,
    enableModal: PropTypes.bool,
    onEndReached: PropTypes.func,
    onEndReachedThreshold: PropTypes.number,
    keyExtractor: PropTypes.func,
  }

  static defaultProps = {
    enableCameraRoll: true,
    itemCount: 100,
    imagesPerRow: 3,
    initialNumToRender: 6,
    removeClippedSubviews: true,
    groupTypes: "All",
    assetType: "Photos",
    imageMargin: 5,
    backgroundColor: "white",
    emptyText: "No photos.",
    loaderColor: "lightblue",
    imageContainerStyle: {},
    sensitivePageScroll: false,
    enableVerticalExit: true,
    enableModal: false,
    onEndReachedThreshold: 0.8,
    permissionDialogTitle: "Read Storage Permission",
    permissionDialogMessage: "Needs access to your photos " +
      "so you can use these awesome services.",
  }

  constructor(props) {
    super(props);
    this.state = {
      resolvedData: [],
      displayImageViewer: false,
      galleryInitialIndex: 0,
      galleryIndex: 0,
      imageId: undefined,
      loadingMore: false,
      noMore: false,
      totalCount: 0
    };
  }

  openImageViewer = async (imageId, index) => {
    await this.setState({ displayImageViewer: true, imageId, galleryInitialIndex: index });
    let lst = this.state.resolvedData.filter((img) => img.id === imageId);
    let image = {id: imageId, galleryInitialIndex: index};
    if (lst.length > 0) {
      image = lst[0];
    }
    this.props.onOpenImageViewer && this.props.onOpenImageViewer(image);
  }

  closeImageViewer = () => {
    this.setState({ displayImageViewer: false, imageId: undefined });
    this.props.onCloseImageViewer && this.props.onCloseImageViewer();
  }

  onChangePhoto = (imageId, galleryIndex) => {
    this.setState({
      imageId,
      galleryIndex
    });
  }

  getMoreData = () => {
    if (!this.state.noMore) {
      this._cameraRollBrowser.fetch(true);
    }
  }

  setMainState = (newState) => {
    this.setState(newState);
  }

  setAssets = (data) => {
    this.setState({
      resolvedData: this.state.resolvedData.concat(data)
    });
  }

  renderChildImageViewer = () => {
    let image = {
      id: this.state.imageId,
      galleryInitialIndex: this.state.galleryInitialIndex,
    };
    if (this.props.renderChildImageViewer) {
      let lst = this.state.resolvedData.filter((img) => img.id === this.state.imageId);
      if (lst.length > 0) {
        image = lst[0];
      }
      return this.props.renderChildImageViewer(image);
    }
    return null;
  }

  render() {
    let Injectant;
    const injectantProps = {};
    if (this.props.enableModal) {
      Injectant = Modal;
      injectantProps.visible = this.state.displayImageViewer &&
        this.state.imageId ? true : false;
      injectantProps.transparent = true;
      injectantProps.animationType = Platform.OS === "ios" ? "none" : "fade";
      injectantProps.hardwareAccelerated = true;
      injectantProps.onRequestClose = this.closeImageViewer;
    } else {
      Injectant = View;
    }

    return (
      <View style={styles.container}
        {...this.props}>
        <CameraRollBrowser
          ref={(component) => {
            this._cameraRollBrowser = component;
          }}
          enableCameraRoll={this.props.enableCameraRoll}
          onGetData={this.props.onGetData}
          itemCount={this.props.itemCount}
          images={this.state.resolvedData}
          imagesPerRow={this.props.imagesPerRow}
          initialNumToRender={this.props.initialNumToRender}
          removeClippedSubviews={this.props.removeClippedSubviews}
          cameraRollFlatListProps={this.props.cameraRollFlatListProps}
          catchGetPhotosError={this.props.catchGetPhotosError}
          groupTypes={this.props.groupTypes}
          assetType={this.props.assetType}
          imageMargin={this.props.imageMargin}
          containerWidth={this.props.containerWidth}
          backgroundColor={this.props.backgroundColor}
          emptyText={this.props.emptyText}
          emptyTextStyle={this.props.emptyTextStyle}
          loader={this.props.loader}
          cameraRollListHeader={this.props.cameraRollListHeader}
          cameraRollListFooter={this.props.cameraRollListFooter}
          imageContainerStyle={this.props.imageContainerStyle}
          renderIndividualHeader={this.props.renderIndividualHeader}
          renderIndividualFooter={this.props.renderIndividualFooter}
          onEndReached={this.props.onEndReached}
          onEndReachedThreshold={this.props.onEndReachedThreshold}
          keyExtractor={this.props.keyExtractor}

          openImageViewer={this.openImageViewer}
          displayImageViewer={this.state.displayImageViewer}
          displayedImageId={this.state.imageId}

          loaderColor={this.props.loaderColor}
          permissionDialogTitle={this.props.permissionDialogTitle}
          permissionDialogMessage={this.props.permissionDialogMessage}
          pendingAuthorizedView={this.props.pendingAuthorizedView}
          notAuthorizedView={this.props.notAuthorizedView}

          setMainState={this.setMainState}
          setAssets={this.setAssets}
          totalCount={this.state.totalCount}
          loadingMore={this.state.loadingMore}
          noMore={this.state.noMore}
        />
        {this.state.displayImageViewer &&
          this.state.imageId &&
          (
            <SafeAreaView>
              <Injectant
                {...injectantProps}>
                  <ImageViewer
                    images={this.state.resolvedData}
                    imageId={this.state.imageId}
                    galleryInitialIndex={this.state.galleryInitialIndex}
                    galleryIndex={this.state.galleryIndex}
                    onClose={this.closeImageViewer}
                    onChangePhoto={this.onChangePhoto}
                    displayImageViewer={this.state.displayImageViewer}

                    imagePageComponent={this.props.imagePageComponent}
                    errorPageComponent={this.props.errorPageComponent}
                    pagesFlatListProps={this.props.pagesFlatListProps}
                    pageMargin={this.props.pageMargin}
                    sensitivePageScroll={this.props.sensitivePageScroll}
                    onPageSelected={this.props.onPageSelected}
                    onPageScrollStateChanged={this.props.onPageScrollStateChanged}
                    onPageScroll={this.props.onPageScroll}
                    pageScrollViewStyle={this.props.pageScrollViewStyle}
                    onPageSingleTapConfirmed={this.props.onPageSingleTapConfirmed}
                    onPageLongPress={this.props.onPageLongPress}
                    renderPageHeader={this.props.renderPageHeader}
                    renderPageFooter={this.props.renderPageFooter}
                    renderChild={this.renderChildImageViewer}

                    onDoubleTapConfirmed={this.props.onDoubleTapConfirmed}
                    onDoubleTapStartReached={this.props.onDoubleTapStartReached}
                    onDoubleTapEndReached={this.props.onDoubleTapEndReached}
                    onPinchTransforming={this.props.onPinchTransforming}
                    onPinchStartReached={this.props.onPinchStartReached}
                    onPinchEndReached={this.props.onPinchEndReached}
                    enableScale={this.props.enableScale}
                    enableTranslate={this.props.enableTranslate}
                    resizeMode={this.props.resizeMode}
                    enableResistance={this.props.enableResistance}
                    resistantStrHorizontal={this.props.resistantStrHorizontal}
                    resistantStrVertical={this.props.resistantStrVertical}
                    onViewTransformed={this.props.onViewTransformed}
                    onTransformGestureReleased={this.props.onTransformGestureReleased}
                    onSwipeUpReleased={this.props.onSwipeUpReleased}
                    onSwipeDownReleased={this.props.onSwipeDownReleased}
                    maxScale={this.props.maxScale}
                    maxOverScrollDistance={this.props.maxOverScrollDistance}
                    enableVerticalExit={this.props.enableVerticalExit}
                    enableModal={this.props.enableModal}

                    getMoreData={this.getMoreData}
                    onEndReached={this.props.onEndReached}
                    onEndReachedThreshold={this.props.onEndReachedThreshold}
                  />
              </Injectant>
            </SafeAreaView>
          )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
